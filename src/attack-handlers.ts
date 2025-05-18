import type WebSocket from 'ws';

import type { AttackData, AttackFeedbackStatus } from './types/types-messages';
import {
  sendToRoomMessage,
  updateRoom,
  updateWinners,
} from './utils/messages-utils';
import {
  checkIfShipDestroyed,
  createBattlefield,
  getSurroundingCells,
  markAroundDestroyedShip,
  setCell,
} from './utils/utils';

import { MESSAGE_TYPES } from './messages-types';
import { store } from './store';

export const attack = (
  ws: WebSocket,
  message: { data: AttackData; id: number },
) => {
  try {
    const { gameId, x, y, indexPlayer } = message.data;

    const room = store.rooms.find((r) => r.roomId === gameId);

    if (!room || room.currentPlayer === undefined) {
      throw new Error('Game room not found or current player not set');
    }

    if (room.currentPlayer !== indexPlayer) {
      throw new Error(
        `It's not your turn! Current player: ${room.currentPlayer}`,
      );
    }

    const attacker = room.roomUsers.find((p) => p.id === indexPlayer);
    const defender = room.roomUsers.find((p) => p.id !== indexPlayer);

    if (
      !attacker ||
      !defender ||
      !defender.battlefield ||
      !attacker.battlefield
    ) {
      throw new Error('Players or battlefields not properly initialized');
    }

    if (x < 0 || x > 9 || y < 0 || y > 9) {
      throw new Error('Attack coordinates must be between 0 and 9');
    }

    const cellValue = defender.battlefield[y]?.[x];

    if (cellValue === 'hit' || cellValue === 'miss') {
      throw new Error('Cell already attacked');
    }

    let status: AttackFeedbackStatus = 'miss';
    let isShipDestroyed = false;

    if (cellValue === 'ship') {
      setCell(defender.battlefield, x, y, 'hit');

      const hitShip = defender.ships.find((ship) => {
        const { position, direction, length } = ship;
        const { x: shipX, y: shipY } = position;

        if (direction) {
          // Vertical
          return x === shipX && y >= shipY && y < shipY + length;
        } else {
          // Horizontal
          return y === shipY && x >= shipX && x < shipX + length;
        }
      });

      if (hitShip) {
        isShipDestroyed = checkIfShipDestroyed(hitShip, defender.battlefield);
        status = isShipDestroyed ? 'killed' : 'shot';

        if (isShipDestroyed) {
          markAroundDestroyedShip(hitShip, defender.battlefield);
          defender.ships = defender.ships.filter((s) => s !== hitShip);

          const surroundingCells = getSurroundingCells(
            hitShip.position,
            hitShip.direction,
            hitShip.length,
          );
          surroundingCells.forEach(({ x, y }) => {
            const surroundingAttackResponse = {
              type: MESSAGE_TYPES.ATTACK,
              data: JSON.stringify({
                position: { x, y },
                currentPlayer: indexPlayer,
                status: 'miss',
              }),
              id: message.id || 0,
            };
            sendToRoomMessage(room, surroundingAttackResponse);
          });
        }
      }
    } else {
      setCell(defender.battlefield, x, y, 'miss');
    }

    const attackResponse = {
      type: MESSAGE_TYPES.ATTACK,
      data: JSON.stringify({
        position: { x, y },
        currentPlayer: indexPlayer,
        status,
      }),
      id: message.id || 0,
    };

    sendToRoomMessage(room, attackResponse);

    // Change turn
    if (status === 'miss') {
      room.currentPlayer = defender.id;
      sendToRoomMessage(room, {
        type: MESSAGE_TYPES.TURN,
        data: JSON.stringify({ currentPlayer: room.currentPlayer }),
        id: message.id || 0,
      });
    }

    if (room.status === 'single') {
      const humanPlayer = room.roomUsers.find((p) => p.ws);
      const botPlayer = room.roomUsers.find((p) => !p.ws);

      if (botPlayer && humanPlayer) {
        if (room.currentPlayer === botPlayer.id) {
          setTimeout(() => {
            const randomAttackMessage = {
              data: {
                gameId: room.roomId,
                indexPlayer: botPlayer.id,
                x: 0,
                y: 0,
              },
              id: 0,
            };
            randomAttack(botPlayer.ws, randomAttackMessage);
          }, 1000);
        }
      }
    }

    if (defender.ships.length === 0) {
      const winner = store.players.find((player) => player.id === attacker.id);
      if (winner) {
        winner.wins += 1;
      }
      sendToRoomMessage(room, {
        type: MESSAGE_TYPES.FINISH,
        data: JSON.stringify({ winPlayer: attacker.id }),
        id: message.id || 0,
      });

      room.roomUsers.forEach((player) => {
        player.battlefield = createBattlefield();
        player.ships = [];
        player.ready = false;
      });

      room.status = 'waiting';
      room.currentPlayer = undefined;
      room.isAvailable = true;

      updateWinners();
      updateRoom();
    }
  } catch (err) {
    const error = err as Error;
    console.error('Attack error:', error.message);
    ws.send(
      JSON.stringify({
        type: 'error',
        message: error.message,
        id: message.id || 0,
      }),
    );
  }
};

export const randomAttack = (
  ws: WebSocket,
  message: {
    data: AttackData;
    id: number;
  },
) => {
  try {
    const { gameId, indexPlayer } = message.data;

    const room = store.rooms.find((r) => r.roomId === gameId);
    if (!room) {
      throw new Error('Game room not found');
    }

    if (room.currentPlayer !== indexPlayer) {
      throw new Error(
        `It's not your turn! Current player: ${room.currentPlayer}`,
      );
    }

    let x: number;
    let y: number;
    do {
      x = Math.floor(Math.random() * 10);
      y = Math.floor(Math.random() * 10);
    } while (
      room.roomUsers.some(
        (p) => p.id !== indexPlayer && p.battlefield[y]?.[x] !== 'empty',
      )
    );

    const attackMessage = {
      data: {
        gameId,
        x,
        y,
        indexPlayer,
      },
      id: message.id || 0,
    };

    attack(ws, attackMessage);
  } catch (err) {
    const error = err as Error;
    console.error('Random attack error:', error.message);
    ws.send(
      JSON.stringify({
        type: 'error',
        message: error.message,
        id: message.id || 0,
      }),
    );
  }
};

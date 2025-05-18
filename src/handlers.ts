import type WebSocket from 'ws';
import type {
  AddShips,
  AddUserToRoom,
  LoginOrCreatePlayerRequest,
} from './types/types-messages';
import type { Player, Room } from './types/types-game';

import {
  createBattlefield,
  filPlayerBattlefield,
  generateId,
} from './utils/utils';
import {
  regError,
  regOk,
  createRoomMessage,
  sendTurnMessage,
  updateRoom,
  updateWinners,
} from './utils/messages-utils';

import { MESSAGE_TYPES } from './messages-types';
import { store } from './store';

export const registration = (
  ws: WebSocket,
  message: LoginOrCreatePlayerRequest,
) => {
  try {
    if (!message.data?.name || !message.data?.password) {
      ws.send(regError('Name and password are required'));

      return;
    }

    const { name, password } = message.data;

    const existingPlayer = store.players.find(
      (player: Player) => player.name === name,
    );

    if (existingPlayer) {
      ws.send(regError('Player already exists'));

      return;
    }

    const newPlayer: Player = {
      id: generateId(),
      name: name,
      password: password,
      ready: false,
      wins: 0,
      ws: ws,
      ships: [],
      battlefield: [],
    };

    store.players.push(newPlayer);

    ws.send(regOk(newPlayer));

    updateRoom();
    updateWinners();
  } catch (err) {
    const error = err as Error;

    ws.send(regError(error.message));
  }
};

export const createRoom = (ws: WebSocket) => {
  try {
    const creator = store.players.find((player) => player.ws === ws);
    if (!creator) {
      throw new Error('Player not found');
    }

    store.rooms = store.rooms.filter(
      (room) => !room.roomUsers.some((user) => user.id === creator.id),
    );

    const newRoom: Room = {
      creator,
      roomId: generateId(),
      roomUsers: [],
      status: 'waiting',
      isAvailable: true,
    };

    store.rooms.push(newRoom);

    addUserToRoom(ws, {
      type: MESSAGE_TYPES.ADD_USER_TO_ROOM,
      data: {
        indexRoom: newRoom.roomId,
      },
      id: 0,
    });

    ws.send(createRoomMessage());

    updateRoom();
    updateWinners();
  } catch (err) {
    const error = err as Error;
    console.log('error: ', error.message);
  }
};

export const addUserToRoom = (ws: WebSocket, message: AddUserToRoom) => {
  try {
    const { indexRoom } = message.data;
    const room = store.rooms.find((room) => room.roomId === indexRoom);
    const player = store.players.find((p) => p.ws === ws);

    if (!room || !player) {
      throw new Error('Player or room not found');
    }

    if (room.roomUsers.length >= 2) {
      throw new Error('Room is already full');
    }

    room.roomUsers.push(player);

    if (room.roomUsers.length === 2) {
      room.status = 'full';
      room.isAvailable = false;

      console.log(`Room ${room.roomId} is now full and unavailable`);
    }

    updateRoom();

    room.roomUsers.forEach((roomPlayer) => {
      roomPlayer.ws.send(
        JSON.stringify({
          type: MESSAGE_TYPES.CREATE_GAME,
          data: JSON.stringify({
            idGame: room.roomId,
            idPlayer: roomPlayer.id,
          }),
          id: message.id || 0,
        }),
      );
    });
  } catch (err) {
    const error = err as Error;
    console.log('error: ', error.message);
  }
};

export const addShips = async (_ws: WebSocket, message: AddShips) => {
  try {
    const { gameId, ships, indexPlayer } = message.data;
    const room = store.rooms.find((r) => r.roomId === gameId);
    const player = room?.roomUsers.find((p) => p.id === indexPlayer);

    if (!room || !player) {
      throw new Error('Player  or room not found');
    }

    player.ships = ships;
    player.battlefield = createBattlefield();
    filPlayerBattlefield(player.ships, player);
    player.ready = true;

    console.log(
      `Player ${player.name} (${player.id}) added ships to game ${gameId}`,
    );

    const allPlayersReady =
      room.roomUsers.length === 2 &&
      room.roomUsers.every((p) => p.ready && p.ships);

    if (allPlayersReady) {
      console.log(`All players ready in room ${gameId}, starting game...`);

      room.roomUsers.forEach((roomPlayer) => {
        const startMessage = {
          type: MESSAGE_TYPES.START_GAME,
          data: JSON.stringify({
            ships: roomPlayer.ships,
            currentPlayerIndex: roomPlayer.id,
          }),
          id: message.id || 0,
        };

        roomPlayer.ws !== null
          ? roomPlayer.ws?.send(JSON.stringify(startMessage))
          : console.log('Start message to bot sended!');
      });

      const firstPlayerIndex =
        room.status === 'single' ? 0 : Math.floor(Math.random() * 2);
      const firstPlayer = room.roomUsers[firstPlayerIndex];

      sendTurnMessage(
        room.roomUsers,
        firstPlayer?.id || player.id,
        message.id || 0,
      );

      room.currentPlayer = firstPlayer?.id;
    }
  } catch (err) {
    const error = err as Error;
    console.log('error: ', error.message);
  }
};

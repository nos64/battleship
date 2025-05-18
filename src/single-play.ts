import type { Player, Room } from './types/types-game';
import type WebSocket from 'ws';

import { MESSAGE_TYPES } from './messages-types';
import { store } from './store';
import {
  createRoomMessage,
  updateRoom,
  updateWinners,
} from './utils/messages-utils';
import { createBattlefield, generateId } from './utils/utils';
import { placeBotShips } from './utils/single-play-utils';
import { addUserToRoom } from './handlers';

export const startSinglePlayerGame = (ws: WebSocket) => {
  try {
    const player = store.players.find((p) => p.ws === ws);
    if (!player) {
      throw new Error('Player not found');
    }

    const bot: Player = {
      id: generateId(),
      name: 'AI Bot',
      password: '',
      ready: false,
      wins: 0,
      ws: null as unknown as WebSocket,
      ships: [],
      battlefield: createBattlefield(),
    };

    const room: Room = {
      creator: player,
      roomId: generateId(),
      roomUsers: [player, bot],
      status: 'single',
      currentPlayer: undefined,
      isAvailable: false,
    };

    store.rooms.push(room);

    ws.send(createRoomMessage());

    addUserToRoom(ws, {
      type: MESSAGE_TYPES.ADD_USER_TO_ROOM,
      data: {
        indexRoom: room.roomId,
      },
      id: 0,
    });

    updateRoom();
    updateWinners();

    placeBotShips(bot);

    ws.send(
      JSON.stringify({
        type: MESSAGE_TYPES.CREATE_GAME,
        data: JSON.stringify({
          idGame: room.roomId,
          idPlayer: player.id,
        }),
        id: 0,
      }),
    );
  } catch (err) {
    const error = err as Error;
    console.error('Single play error:', error.message);
    if (ws && typeof ws.send === 'function') {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message,
          id: 0,
        }),
      );
    }
  }
};

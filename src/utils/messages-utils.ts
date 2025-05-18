import type WebSocket from 'ws';
import { type Player } from '../types/types-game';

import { MESSAGE_TYPES } from '../messages-types';
import { store } from '../store';

export const regOk = (player: Player, id = 0) =>
  JSON.stringify({
    type: MESSAGE_TYPES.REG,
    data: JSON.stringify({
      name: player.name,
      index: player.id,
    }),
    id,
  });

export const regError = (errorText: string, id = 0) =>
  JSON.stringify({
    type: MESSAGE_TYPES.REG,
    data: JSON.stringify({
      error: true,
      errorText,
    }),
    id,
  });

export const createRoomMessage = (id = 0) =>
  JSON.stringify({
    type: MESSAGE_TYPES.CREATE_ROOM,
    data: '',
    id,
  });

export const updateRoom = () => {
  const availableRooms = store.rooms.filter(
    (room) => room.isAvailable && room.roomUsers.length < 2,
  );

  const updateMessage = {
    type: MESSAGE_TYPES.UPDATE_ROOM,
    data: JSON.stringify(
      availableRooms.map((room) => ({
        roomId: room.roomId,
        roomUsers: room.roomUsers.map((user) => ({
          name: user.name,
          index: user.id,
        })),
      })),
    ),
    id: 0,
  };

  store.players.forEach((player) => {
    player.ws?.send(JSON.stringify(updateMessage));
  });
};

export const updateWinners = (id = 0): string => {
  const winnersData = store.players
    .map((player) => ({
      name: player.name,
      wins: player.wins || 0,
    }))
    .sort((a, b) => b.wins - a.wins);

  const message = JSON.stringify({
    type: MESSAGE_TYPES.UPDATE_WINNERS,
    data: JSON.stringify(winnersData),
    id,
  });

  store.players.forEach((player) => {
    player.ws?.send(message);
  });

  return message;
};

export const sendTurnMessage = (
  roomUsers: Player[],
  currentPlayerId: number | string,
  messageId: number,
) => {
  const turnMessage = {
    type: MESSAGE_TYPES.TURN,
    data: JSON.stringify({
      currentPlayer: currentPlayerId,
    }),
    id: messageId,
  };

  roomUsers.forEach((roomPlayer) => {
    roomPlayer.ws !== null
      ? roomPlayer.ws.send(JSON.stringify(turnMessage))
      : console.log('Bot message');
  });
};

export const sendToRoomMessage = (
  room: { roomUsers: { ws?: WebSocket; id: number | string }[] },
  message: unknown,
) => {
  room.roomUsers.forEach((player) => {
    if (player.ws && player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
};

import { MESSAGE_TYPES } from '../constants/messages-types';

import type { Position, Ship } from './types-game';

type Body<T, V extends string> = {
  type: V;
  data: T;
  id: number;
};

type LoginOrCreatePlayerDataRequest = {
  name: string;
  password: string;
};

export type LoginOrCreatePlayerRequest = Body<
  LoginOrCreatePlayerDataRequest,
  typeof MESSAGE_TYPES.REG
>;

type AddUserToRoomData = {
  indexRoom: number | string;
};

export type AddUserToRoom = Body<
  AddUserToRoomData,
  typeof MESSAGE_TYPES.ADD_USER_TO_ROOM
>;

type ShipsData = {
  gameId: number | string;
  indexPlayer: number | string;
  ships: Ship[];
};

export type AddShips = Body<ShipsData, typeof MESSAGE_TYPES.ADD_SHIPS>;

export type AttackData = Position & {
  gameId: number | string;
  indexPlayer: number | string;
};

export type Attack = Body<AttackData, typeof MESSAGE_TYPES.ATTACK>;

export type AttackFeedbackStatus = 'miss' | 'killed' | 'shot';

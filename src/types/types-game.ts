import type WebSocket from 'ws';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';

export type Position = {
  x: number;
  y: number;
};

export type Ship = {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
};

export type Player = {
  name: string;
  id: number | string;
  password: string;
  ships: Ship[];
  wins: number;
  ws: WebSocket;
  ready: boolean;
  battlefield: Battlefield;
  error?: boolean;
  errorText?: string;
};

export type Room = {
  creator: Player;
  roomId: number;
  roomUsers: Player[];
  status: 'waiting' | 'full';
  currentPlayer?: number | string;
  isAvailable: boolean;
};

export type Game = {
  idGame: number;
  roomId: number;
  players: Player[];
  currentPlayerTurn: number;
};

export type BattlefieldCellState = 'empty' | 'ship' | 'hit' | 'miss' | 'shot';

export type Battlefield = BattlefieldCellState[][];

export type Store = {
  players: Player[];
  rooms: Room[];
  games: Game[];
};

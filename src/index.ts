import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import os from 'os';

import { httpServer } from './http_server';

import { MESSAGE_TYPES } from './constants/messages-types';
import { parseMessage } from './utils/game-utils';

import {
  addShips,
  addUserToRoom,
  createRoom,
  registration,
} from './handlers/game';
import { attack, randomAttack } from './handlers/attack';
import { startSinglePlayerGame } from './handlers/single-play';

dotenv.config();

const HTTP_PORT = 8181;

const PORT = Number(process.env.PORT) || 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
const server = httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: PORT });

console.log(`Web Socket Server started on port ${wss.options.port}`);

wss.on('connection', (ws, req) => {
  console.log(
    'New connection from address:',
    req.socket.remoteAddress,
    'port:',
    req.socket.remotePort,
  );

  ws.on('message', async (rawMessage) => {
    try {
      const message = parseMessage(rawMessage.toString());

      console.log('Processed message:', message);

      if (!message) {
        console.error('Invalid message format');
        return;
      }

      if (!message.type) {
        throw new Error('Invalid message format');
      }

      switch (message.type) {
        case MESSAGE_TYPES.REG:
          registration(ws, message);

          break;

        case MESSAGE_TYPES.CREATE_ROOM:
          createRoom(ws);

          break;

        case MESSAGE_TYPES.ADD_USER_TO_ROOM:
          addUserToRoom(ws, message);

          break;

        case MESSAGE_TYPES.ADD_SHIPS:
          await addShips(ws, message);

          break;

        case MESSAGE_TYPES.ATTACK:
          attack(ws, message);

          break;

        case MESSAGE_TYPES.RANDOM_ATTACK:
          randomAttack(ws, message);

          break;

        case MESSAGE_TYPES.SINGLE_PLAY:
          startSinglePlayerGame(ws);

          break;
      }
    } catch (err: unknown) {
      const error = err as Error;

      console.error('Error:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message,
        }),
      );
    }
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
});

process.on('SIGINT', () => {
  wss.clients.forEach((client) => client.close());
  wss.close();
  console.log('Server stopped');

  server.close(() => {
    console.log(`${os.EOL}Server closed`);
  });
  process.exit();
});

import { createBattlefield, setCell } from './game-utils';
import type { Battlefield, Player, Ship } from '../types/types-game';

const isShipCanBePlaced = (
  battlefield: Battlefield,
  x: number,
  y: number,
  direction: boolean,
  length: number,
) => {
  for (let i = -1; i <= length; i++) {
    for (let j = -1; j <= 1; j++) {
      const checkX = direction ? x + j : x + i;
      const checkY = direction ? y + i : y + j;

      if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
        if (i >= 0 && i < length && j === 0) {
          if (battlefield[checkY]?.[checkX] !== 'empty') {
            return false;
          }
        } else {
          if (battlefield[checkY]?.[checkX] === 'ship') {
            return false;
          }
        }
      }
    }
  }
  return true;
};

const placeShipOnBattlefield = (battlefield: Battlefield, ship: Ship) => {
  const {
    position: { x, y },
    direction,
    length,
  } = ship;

  for (let i = 0; i < length; i++) {
    const nx = direction ? x : x + i;
    const ny = direction ? y + i : y;
    setCell(battlefield, nx, ny, 'ship');
  }
};

export const placeBotShips = (bot: Player) => {
  const shipTypes = [
    { type: 'huge', length: 4, count: 1 },
    { type: 'large', length: 3, count: 2 },
    { type: 'medium', length: 2, count: 3 },
    { type: 'small', length: 1, count: 4 },
  ];

  bot.ships = [];
  bot.battlefield = createBattlefield();

  for (const shipType of shipTypes) {
    for (let i = 0; i < shipType.count; i++) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const direction = Math.random() > 0.5;
        const x = Math.floor(
          Math.random() * (10 - (direction ? 0 : shipType.length)),
        );
        const y = Math.floor(
          Math.random() * (10 - (direction ? shipType.length : 0)),
        );

        if (
          isShipCanBePlaced(bot.battlefield, x, y, direction, shipType.length)
        ) {
          const ship = {
            position: { x, y },
            direction,
            length: shipType.length,
            type: shipType.type as Ship['type'],
          };

          bot.ships.push(ship);
          placeShipOnBattlefield(bot.battlefield, ship);
          placed = true;
        }
      }

      if (!placed && attempts >= maxAttempts) {
        console.error(
          `Failed to place ${shipType.type} ship after ${maxAttempts} attempts`,
        );
      }
    }
  }

  bot.ready = true;
  console.log('Bot ships placed successfully');
};

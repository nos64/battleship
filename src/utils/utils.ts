import type {
  Battlefield,
  BattlefieldCellState,
  Player,
  Position,
  Ship,
} from '../types/types-game';

export const parseMessage = (rawMessage: string) => {
  try {
    const { type, data, id } = JSON.parse(rawMessage);

    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      parsedData = data;
    }

    return {
      type,
      data: parsedData,
      id,
    };
  } catch (err) {
    const error = err as Error;

    console.error('Parsing error:', error.message);
    return null;
  }
};

export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

export const createBattlefield = (): Battlefield => {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => 'empty' as BattlefieldCellState),
  );
};

export const filPlayerBattlefield = (ships: Ship[], player: Player) => {
  ships.forEach((ship) => {
    const { x, y } = ship.position;
    if (ship.direction) {
      // Vertical
      for (let i = 0; i < ship.length; i++) {
        const ny = y + i;
        if (ny < 10) {
          setCell(player.battlefield, x, y + i, 'ship');
        }
      }
    } else {
      // Horizontal
      for (let i = 0; i < ship.length; i++) {
        const nx = x + i;
        if (nx < 10) {
          setCell(player.battlefield, x + i, y, 'ship');
        }
      }
    }
  });
};

export const checkIfShipDestroyed = (
  ship: Ship,
  battlefield: Battlefield,
): boolean => {
  const { position, direction, length } = ship;
  const { x, y } = position;

  for (let i = 0; i < length; i++) {
    const checkX = direction ? x : x + i;
    const checkY = direction ? y + i : y;

    if (battlefield[checkY]?.[checkX] !== 'hit') {
      return false;
    }
  }
  return true;
};

export const markAroundDestroyedShip = (
  ship: Ship,
  battlefield: Battlefield,
) => {
  const { position, direction, length } = ship;
  const { x, y } = position;

  for (let dx = -1; dx <= (direction ? length : 1); dx++) {
    for (let dy = -1; dy <= (direction ? 1 : length); dy++) {
      const nx = x + (direction ? dx : dy);
      const ny = y + (direction ? dy : dx);

      const currentCell = battlefield[ny]?.[nx];

      if (currentCell === 'empty') {
        setCell(battlefield, nx, ny, 'miss');
      }
    }
  }
};

export const getSurroundingCells = (
  position: Position,
  direction: boolean,
  length: number,
) => {
  const cells = [];
  const { x, y } = position;

  if (direction) {
    // Vertical ship
    for (let i = -1; i <= length; i++) {
      for (let j = -1; j <= 1; j++) {
        // Add side cell
        if (i === -1 || i === length) {
          cells.push({ x: x + j, y: y + i });
        }
        // Add up & down cell
        if (i >= 0 && i < length && (j === -1 || j === 1)) {
          cells.push({ x: x + j, y: y + i });
        }
      }
    }
  } else {
    // Horizontal ship
    for (let i = -1; i <= length; i++) {
      for (let j = -1; j <= 1; j++) {
        // Add up & down cell
        if (i === -1 || i === length) {
          cells.push({ x: x + i, y: y + j });
        }
        // Vertical ship
        if (i >= 0 && i < length && (j === -1 || j === 1)) {
          cells.push({ x: x + i, y: y + j });
        }
      }
    }
  }

  // Filter the cells outside the field
  return cells
    .filter((cell) => cell.x >= 0 && cell.x < 10 && cell.y >= 0 && cell.y < 10)
    .filter(
      (cell, index, self) =>
        self.findIndex((c) => c.x === cell.x && c.y === cell.y) === index,
    );
};

export const setCell = (
  battlefield: Battlefield,
  x: number,
  y: number,
  value: BattlefieldCellState,
) => {
  if (!Array.isArray(battlefield)) return;

  // Is Y coord valid
  if (y < 0 || y >= battlefield.length) return;

  const row = battlefield[y];

  if (!Array.isArray(row)) return;

  // Is X coord valid
  if (x < 0 || x >= row.length) return;

  const newRow = [...row];
  newRow[x] = value;

  const newBattlefield = [...battlefield];
  newBattlefield[y] = newRow;

  battlefield.splice(0, battlefield.length, ...newBattlefield);
};

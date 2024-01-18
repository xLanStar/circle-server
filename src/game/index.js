import { BufferWriter } from "../bufferWriter.js";
import logger from "../logger.js";
import wss, { broadcast } from "../server/websocket.js";
import {
  Type,
  getPlayerBuffer,
  getUpdateBuffer,
} from "../utils/packet.utils.js";

const hrtimeMs = () => {
  let time = process.hrtime();
  return time[0] + time[1] / 1000000000;
};

// Game constants
const FPS = 33;
const TICK_LENGTH = 1000 / FPS;

// Map constants
export const MAP_SIZE = 1 << 12;
const MAP_BOUND = MAP_SIZE - 1;
const GRID_SIZE = MAP_SIZE / 16;
const DOT_COUNT = 1000;

// Player constants
const PLAYER_SIZE = 32;
const PLAYER_RADIUS = PLAYER_SIZE / 2;
export const MOVEMENT_SPEED = 100;

// Dot constants
const DOT_SIZE = 16;
const DOT_RADIUS = DOT_SIZE / 2;

export const dots_map = new Array(16).fill().map(() => new Array(16).fill([]));
export const dots = {};
export const players = {};
let previousTick = hrtimeMs();

export const getPlayer = (id) => players[id];

export const addPlayer = (name, color, client) => {
  const player = {
    client,
    id: client.id,
    name,
    color,
    x: 0,
    y: 0,
    // x: Math.random() * MAP_SIZE,
    // y: Math.random() * MAP_SIZE,
    dx: 0,
    dy: 0,
    score: 0,
    radius: PLAYER_RADIUS,
  };
  players[player.id] = player;
  broadcast(getPlayerBuffer(Type.AddPlayer, player));
  return player;
};

export const removePlayer = (id) => {
  players[id];
  const buffer = new BufferWriter(2 + id.length);
  // 1. Type
  buffer.writeUInt8(Type.RemovePlayer);
  // 2. Player
  buffer.write(id);
  broadcast(buffer);
  delete players[id];
};

// const addBot = () =>
//   addPlayer(`Bot`, Math.floor(Math.random() * 0xffffffff), {
//     id: generateBotId(),
//   });

const initGame = () => {
  logger.info("[Game] init");
  for (let i = 0; i < DOT_COUNT; ++i) addDot();
};

const addDot = () => {
  let dotX = Math.floor(Math.random() * MAP_SIZE);
  let dotY = Math.floor(Math.random() * MAP_SIZE);
  let dotId = (dotX << 16) + dotY;
  while (
    dots[dotId] ||
    Object.values(players).some(
      ({ x, y, radius }) =>
        (x - dotX) * (x - dotX) + (y - dotY) * (y - dotY) <= radius * radius
    )
  ) {
    dotX = Math.floor(Math.random() * MAP_SIZE);
    dotY = Math.floor(Math.random() * MAP_SIZE);
    dotId = (dotX << 16) + dotY;
  }
  dots_map[Math.floor(dotX / GRID_SIZE)][Math.floor(dotY / GRID_SIZE)].push(
    dotId
  );
  dots[dotId] = dotId;
  return dotId;
};

// const generateBotId = () => {
//   let botId = "";
//   for (let i = 0; i < 24; i++)
//     botId += Math.floor(Math.random() * 16).toString(16);
//   return botId;
// };

// reuse buffer
export const startGame = () => {
  logger.info("[Game] start");
  initGame();

  // Add Bots
  // for (let i = 0; i < 100; ++i) addBot();

  let ateDots = [];
  let newDots = [];
  setInterval(() => {
    const now = hrtimeMs();
    if (wss.clients.size) {
      const delta = now - previousTick;
      const players_array = Object.values(players);
      for (const player of players_array) {
        if (!player.id) continue; // player has been eaten
        let { x, y, dx, dy, radius } = player;
        // update player position
        x = Math.min(Math.max(x + dx * MOVEMENT_SPEED * delta, 0), MAP_BOUND);
        y = Math.min(Math.max(y + dy * MOVEMENT_SPEED * delta, 0), MAP_BOUND);
        player.x = x;
        player.y = y;
        // check whether player has been eaten
        for (const other_player of players_array) {
          if (other_player === player) continue;
          const { x: otherX, y: otherY, radius: otherRadius } = other_player;
          if (
            (otherX - x) * (otherX - x) + (otherY - y) * (otherY - y) <
            (radius - otherRadius) * (radius - otherRadius)
          ) {
            player.score += 10 + other_player.score;
            removePlayer(other_player.id);
            other_player.id = null;
          }
        }
        // check whether player ate dots
        const topBound = Math.min(Math.max(x - radius, 0), MAP_BOUND);
        const bottomBound = Math.min(Math.max(x + radius, 0), MAP_BOUND);
        const leftBound = Math.min(Math.max(y - radius, 0), MAP_BOUND);
        const rightBound = Math.min(Math.max(y + radius, 0), MAP_BOUND);
        const startIndex = Math.floor(topBound / GRID_SIZE);
        const endIndex = Math.floor(bottomBound / GRID_SIZE);
        const startIndexY = Math.floor(leftBound / GRID_SIZE);
        const endIndexY = Math.floor(rightBound / GRID_SIZE);
        for (let i = startIndex; i <= endIndex; ++i) {
          for (let j = startIndexY; j <= endIndexY; ++j) {
            const grid = dots_map[i][j];
            for (let k = 0; k != grid.length; ++k) {
              const dotId = grid[k];
              const dotX = dotId >> 16;
              const dotY = dotId & 0xffff;
              if (
                (dotX - x) * (dotX - x) + (dotY - y) * (dotY - y) <=
                (radius - DOT_RADIUS) * (radius - DOT_RADIUS)
              ) {
                ateDots.push(dotId);
                delete dots[dotId];
                grid.splice(k--, 1);
                ++player.score;
              }
            }
          }
        }
        player.radius = PLAYER_RADIUS * (1 + player.score / 20);
      }
      if (ateDots.length) {
        newDots = new Array(ateDots.length);
        for (let i = 0; i != ateDots.length; ++i) newDots[i] = addDot();
      }
      broadcast(getUpdateBuffer(ateDots.length && [ateDots, newDots]));
      if (ateDots.length) {
        ateDots = [];
        newDots = [];
      }
    }
    previousTick = now;
  }, TICK_LENGTH);
};

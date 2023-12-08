import { BufferWriter } from "../bufferWriter.js";
import { MAP_SIZE, MOVEMENT_SPEED, dots, players } from "../game/index.js";

// 封包類型
export const Type = {
  Init: 0, // 玩家連線時，初始化遊戲資料
  Join: 1, // 玩家加入遊戲
  Leave: 2, // 玩家離開遊戲
  AddPlayer: 3, // 新增玩家
  RemovePlayer: 4, // 移除玩家
  Update: 5, // 更新遊戲資料
  Move: 6, // 玩家移動
};

/**
 *
 * @param {BufferWriter} buffer
 * @param {*} player
 */
export const writePlayer = (buffer, player) => {
  buffer.write(player.id);
  buffer.write(player.name);
  buffer.writeUInt32LE(player.color);
  buffer.writeFloatLE(player.x);
  buffer.writeFloatLE(player.y);
  buffer.writeFloatLE(player.dx);
  buffer.writeFloatLE(player.dy);
  buffer.writeUInt32LE(player.score);
};

export const getPlayerSize = (player) =>
  1 + 24 + 1 + player.name.length + 4 * 6;

export const getInitBuffer = (client) => {
  const players_array = Object.values(players).filter((p) => p.id);
  const dots_array = Object.values(dots);
  let bufferSize = 2 + client.id.length + 16 + 4 * dots_array.length;
  for (const player of players_array) bufferSize += getPlayerSize(player);
  const buffer = new BufferWriter(bufferSize);
  // 1. Type
  buffer.writeUInt8(Type.Init);
  // 2. Client Id
  buffer.write(client.id);
  // 3. Map Size
  buffer.writeUInt32LE(MAP_SIZE);
  // 4. Movement Speed
  buffer.writeUInt32LE(MOVEMENT_SPEED);
  // 5. Player
  buffer.writeUInt32LE(players_array.length);
  for (const player of players_array) writePlayer(buffer, player);
  // 6. Dots
  buffer.writeUInt32LE(dots_array.length);
  for (const dot of dots_array) buffer.writeUInt32LE(dot);
  return buffer;
};

export const getPlayerBuffer = (type, player) => {
  const buffer = new BufferWriter(1 + getPlayerSize(player));
  // 1. Type
  buffer.writeUInt8(type);
  // 2. Player
  writePlayer(buffer, player);
  return buffer;
};

export const getUpdateBuffer = (dots) => {
  const players_array = Object.values(players).filter((p) => p.id);
  let bufferSize = 6;
  for (const player of players_array) {
    bufferSize += 1 + player.id.length + 4 * 5;
  }
  if (dots) bufferSize += 4 + 4 * (dots[0].length + dots[1].length);
  const buffer = new BufferWriter(bufferSize);
  // 1. Type
  buffer.writeUInt8(Type.Update);
  // 2. State Bits (xxxx xxA) A: dots
  buffer.writeUInt8(0 | (dots ? 1 : 0));
  // 3. Players
  buffer.writeUInt32LE(players_array.length);
  for (const player of players_array) {
    buffer.write(player.id);
    buffer.writeFloatLE(player.x);
    buffer.writeFloatLE(player.y);
    buffer.writeFloatLE(player.dx);
    buffer.writeFloatLE(player.dy);
    buffer.writeUInt32LE(player.score);
  }
  // 4. Dots
  if (dots) {
    const [ateDots, newDots] = dots;
    buffer.writeUInt32LE(ateDots.length);
    for (let i = 0; i != ateDots.length; ++i) {
      buffer.writeUInt32LE(ateDots[i]);
      buffer.writeUInt32LE(newDots[i]);
    }
  }
  return buffer;
};

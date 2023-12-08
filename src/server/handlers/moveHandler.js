import { Type } from "../../utils/packet.utils.js";

export default {
  type: Type.Move,
  handler: (buffer, client) => {
    const player = client.player;
    if (!player) return;
    player.dx = buffer.readFloatLE();
    player.dy = buffer.readFloatLE();
  },
};

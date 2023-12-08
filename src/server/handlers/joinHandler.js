import { addPlayer } from "../../game/index.js";
import logger from "../../logger.js";
import { Type } from "../../utils/packet.utils.js";

export default {
  type: Type.Join,
  handler: (buffer, client) => {
    client.player = addPlayer(buffer.read(), buffer.readUInt32LE(), client);
    logger.info("join: %s %s", client.id, client.player);
  },
};

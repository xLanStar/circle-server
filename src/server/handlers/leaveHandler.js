import { removePlayer } from "../../game/index.js";
import logger from "../../logger.js";
import { Type } from "../../utils/packet.utils.js";

export default {
  type: Type.Leave,
  handler: (_, client) => {
    if (!client.player) return;
    logger.info("leave: %s", client.id);
    removePlayer(client.id);
  },
};

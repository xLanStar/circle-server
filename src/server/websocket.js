import { readdirSync } from "fs";
import { WebSocketServer } from "ws";
import { BufferReader } from "../bufferReader.js";
import logger from "../logger.js";
import { Type, getInitBuffer } from "../utils/packet.utils.js";

const server = new WebSocketServer({ port: 8080, maxPayload: 1000000 });
const handlers = {};

const loadHandlers = async () => {
  for (const file of readdirSync("./src/server/handlers")) {
    const handler = (await import(`./handlers/${file}`)).default;
    logger.info(`[Server] register handler: ${file} type: ${handler.type}`);
    handlers[handler.type] = handler.handler;
  }
};

export const broadcast = (buffer) => {
  for (const client of server.clients) client.send(buffer);
};

export const startWebSocketServer = async () => {
  logger.info("[Server] start");
  await loadHandlers();

  server.addListener("connection", (client, request) => {
    client.id = request.headers["sec-websocket-key"];
    client.send(getInitBuffer(client));
    logger.info("[Server] new client: %s", client.id);

    client.onmessage = (messageEvent) => {
      const buffer = new BufferReader(messageEvent.data);
      handlers[buffer.readUInt8()](buffer, client);
    };

    client.onclose = (closeEvent) => {
      logger.info("closed: %s", closeEvent.reason);
      handlers[Type.Leave](null, client);
    };

    // client.send(JSON.stringify({ message: "Hello" }));
  });
};

export default server;

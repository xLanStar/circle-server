import { startWebServer } from "./web.js";
import { startWebSocketServer } from "./websocket.js";

export * from "./web.js";
export * from "./websocket.js";

export const startServer = async () => {
  await startWebServer();
  await startWebSocketServer();
};

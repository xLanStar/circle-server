import express from "express";
import { readFileSync } from "fs";
import https from "https";
import { resolve } from "path";
import logger from "../logger.js";

const app = express();
app.use((req, res, next) => {
  logger.info(req.url);
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});
app.use(express.static(resolve() + "/web"));

const { WEB_PORT } = process.env;

export const startWebServer = async () => {
  var hskey = readFileSync("cert/key.pem", "utf8");
  var hscert = readFileSync("cert/cert.crt", "utf8");

  https
    .createServer(
      {
        key: hskey,
        cert: hscert,
      },
      app
    )
    .listen(WEB_PORT, () => {
      console.log("Express https server listening on port " + WEB_PORT);
    });
};

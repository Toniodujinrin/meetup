import express from "express";
import http from "http";
import https from "https";
import startup from "./server/startup";
import conncectToDatabase from "./lib/mongoconnect";
import Processes from "./lib/processes";
import { Server } from "socket.io";
import socketHandler from "./server/socket";

require("dotenv").config();
Processes.envChecker();
conncectToDatabase();
const app = express();
startup(app);
const httpServer = http.createServer(app);
const httpsServer = https.createServer(
  {
    key: process.env.SERVER_KEY,
    cert: process.env.FULL_CHAIN,
    // ca: process.env.CA,
  },
  app
);

let io;
if (process.env.NODE_ENV !== "development") {
  console.log("\x1b[35m%s\x1b[0m", "[+] production socket open");
  io = new Server(httpsServer, {
    cors: {
      origin: [
        "https://meet-up-client.vercel.app",
        "http://localhost:3000",
        "http://10.0.0.84:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
} else {
  console.log("\x1b[35m%s\x1b[0m", "[+] develpment socket open");
  io = new Server(httpServer, {
    cors: {
      origin: [
        "https://meet-up-client.vercel.app",
        "http://localhost:3000",
        "http://10.0.0.84:3000",
      ],
      methods: ["GET", "POST"],
    },
  });
}

socketHandler(io);

httpsServer.listen(process.env.HTTPS, () => {
  console.log(
    "\x1b[32m%s\x1b[0m",
    `[o] https server listening on port ${process.env.HTTPS}`
  );
});

httpServer.listen(process.env.PORT, () => {
  console.log(
    "\x1b[32m%s\x1b[0m",
    `[o] http server listening on port ${process.env.PORT}`
  );
});

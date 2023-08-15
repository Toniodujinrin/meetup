"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const startup_1 = __importDefault(require("./server/startup"));
const mongoconnect_1 = __importDefault(require("./lib/mongoconnect"));
const processes_1 = __importDefault(require("./lib/processes"));
const socket_io_1 = require("socket.io");
const socket_1 = __importDefault(require("./server/socket"));
require("dotenv").config();
processes_1.default.envChecker();
(0, mongoconnect_1.default)();
// Processes.otpProcess()
processes_1.default.messageProcess();
const app = (0, express_1.default)();
(0, startup_1.default)(app);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: `*`
    }
});
(0, socket_1.default)(io);
server.listen(process.env.PORT, () => {
    console.log("\x1b[32m%s\x1b[0m", `[o] server listening on port ${process.env.PORT}`);
});

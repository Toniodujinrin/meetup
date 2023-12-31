"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const startup_1 = __importDefault(require("./server/startup"));
const mongoconnect_1 = __importDefault(require("./lib/mongoconnect"));
const processes_1 = __importDefault(require("./lib/processes"));
const socket_io_1 = require("socket.io");
const socket_1 = __importDefault(require("./server/socket"));
require("dotenv").config();
processes_1.default.envChecker();
(0, mongoconnect_1.default)();
const app = (0, express_1.default)();
(0, startup_1.default)(app);
const httpServer = http_1.default.createServer(app);
const httpsServer = https_1.default.createServer({
    key: process.env.SERVER_KEY,
    cert: process.env.SERVER_CERT,
    ca: process.env.FULL_CHAIN,
}, app);
let io;
if (process.env.NODE_ENV !== "development") {
    console.log("\x1b[35m%s\x1b[0m", "[+] production socket open");
    io = new socket_io_1.Server(httpsServer, {
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
}
else {
    console.log("\x1b[35m%s\x1b[0m", "[+] develpment socket open");
    io = new socket_io_1.Server(httpServer, {
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
(0, socket_1.default)(io);
httpsServer.listen(process.env.HTTPS, () => {
    console.log("\x1b[32m%s\x1b[0m", `[o] https server listening on port ${process.env.HTTPS}`);
});
httpServer.listen(process.env.PORT, () => {
    console.log("\x1b[32m%s\x1b[0m", `[o] http server listening on port ${process.env.PORT}`);
});

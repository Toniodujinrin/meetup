"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const startup_1 = __importDefault(require("./server/startup"));
const mongoconnect_1 = __importDefault(require("./mongo/mongoconnect"));
const processes_1 = __importDefault(require("./lib/processes"));
require("dotenv").config();
processes_1.default.envChecker();
(0, mongoconnect_1.default)();
const app = (0, express_1.default)();
(0, startup_1.default)(app);
http_1.default.createServer(app)
    .listen(process.env.PORT, () => {
    console.log(`server listening on port ${process.env.PORT}`);
});

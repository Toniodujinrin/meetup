"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socketAuthentication_1 = __importDefault(require("../middleware/socketAuthentication"));
const socket_1 = __importDefault(require("../lib/socket"));
const socketHandler = (io) => {
    io.use(socketAuthentication_1.default);
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("user connected", socket.user);
        const onlineContacts = yield socket_1.default.getAllOnlineContacts(socket.user, io);
        socket.emit("onlineContacts", onlineContacts);
        socket.on("join", ({ conversationId }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const groupKey = yield socket_1.default.getUserGroupKey(socket.user, conversationId);
                socket.emit("groupKey", groupKey);
                socket.join(conversationId);
                const previousMessages = yield socket_1.default.getPreviousMessages(conversationId, socket);
                socket.emit("previousMessages", previousMessages);
                const onlineUsers = yield socket_1.default.getAllSocketsInRoom(io, conversationId);
                io.to(conversationId).emit("onlineUsers", onlineUsers);
            }
            catch (error) {
                console.log(error);
                socket.emit("conn_error", error);
            }
        }));
        socket.on("leaveRoom", ({ conversationId }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield socket_1.default.leaveRoom(socket, io, conversationId);
            }
            catch (error) {
                socket.emit("conn_error", error);
            }
        }));
        socket.on("message", ({ body, conversationId }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield socket_1.default.sendMessage(io, body, conversationId, socket.user);
            }
            catch (error) {
                socket.emit("conn_error", error);
            }
        }));
        socket.on("disconnecting", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield socket_1.default.leaveAllRooms(socket, io);
                yield socket_1.default.updateLastSeen(socket.user);
            }
            catch (error) {
                socket.emit("conn_error", error);
            }
        }));
    }));
};
exports.default = socketHandler;

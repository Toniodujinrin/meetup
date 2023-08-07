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
const message_1 = __importDefault(require("../models/message"));
const socketHandler = (io) => {
    io.use(socketAuthentication_1.default);
    io.on("connection", (socket) => {
        console.log("user connected");
        socket.on("join", ({ conversationId }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const groupKey = socket_1.default.getUserGroupKey(socket.user, conversationId);
                socket.emit("groupKey", groupKey);
                socket.join(conversationId);
                const previousMessages = yield socket_1.default.getPreviousMessages(conversationId);
                socket.emit("previousMessages", previousMessages);
                const onlineUsers = socket_1.default.getAllSockets(io, conversationId);
                socket.emit("onlineUsers", onlineUsers);
            }
            catch (error) {
                socket.emit("connect_error", error);
            }
        }));
        socket.on("message", ({ text, conversationId }) => __awaiter(void 0, void 0, void 0, function* () {
            let message = new message_1.default({
                conversationId,
                body: {
                    text,
                    senderId: socket.user
                }
            });
            message = yield message.save();
            io.to(conversationId).emit("message", message);
        }));
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            socket_1.default.leaveAllRooms(socket, io);
            socket_1.default.updateLastSeen(socket.user);
        }));
    });
};
exports.default = socketHandler;

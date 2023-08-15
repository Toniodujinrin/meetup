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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const users_1 = __importDefault(require("../models/users"));
const conversations_1 = __importDefault(require("../models/conversations"));
const message_1 = __importDefault(require("../models/message"));
class SocketLib {
}
_a = SocketLib;
SocketLib.getAllSocketsInRoom = (io, room) => __awaiter(void 0, void 0, void 0, function* () {
    const clients = yield io.in(room).fetchSockets();
    const ids = clients.map((client) => { return client.user; });
    return ids;
});
SocketLib.leaveAllRooms = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    for (let room of socket.rooms) {
        if (room !== socket.id) {
            let ids = yield _a.getAllSocketsInRoom(io, room);
            ids = ids.filter(id => id !== socket.user);
            io.to(room).emit("onlineUsers", ids);
        }
    }
});
SocketLib.leaveRoom = (socket, io, conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield socket.leave(conversationId);
    const ids = yield _a.getAllSocketsInRoom(io, conversationId);
    io.to(conversationId).emit("onlineUsers", ids);
});
SocketLib.getAllSockets = (io) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield io.fetchSockets();
    const ids = client.map((client) => { return client.user; });
    return ids;
});
//room for optimization
SocketLib.getAllOnlineContacts = (userId, io) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_1.default.findById(userId);
    const onlineContacts = [];
    if (user) {
        const contacts = user.contacts;
        const onlineUsers = yield _a.getAllSockets(io);
        for (let contact of contacts) {
            if (onlineUsers.includes(contact)) {
                onlineContacts.push(contact);
            }
        }
    }
    return onlineContacts;
});
SocketLib.sendMessage = (io, body, conversationId, senderId) => __awaiter(void 0, void 0, void 0, function* () {
    let message = new message_1.default({
        conversationId,
        body,
        senderId
    });
    message = yield message.save();
    const msg = yield message_1.default.findById(message._id).populate({ path: "senderId", select: "_id username" });
    io.to(conversationId).emit("new_message", msg);
});
SocketLib.updateLastSeen = (email) => __awaiter(void 0, void 0, void 0, function* () {
    yield users_1.default.findByIdAndUpdate(email, {
        $set: { lastSeen: Date.now() }
    });
});
SocketLib.getUserGroupKey = (email, conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_1.default.findById(email);
    if (user && user.conversations) {
        const conversation = user.conversationKeys.find(conversation => conversation.conversationId == conversationId);
        if (!conversation)
            throw new Error("unauthorized user");
        return conversation.groupKey;
    }
    throw new Error("invalid user");
});
SocketLib.getPreviousMessages = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    let previousMessages = yield conversations_1.default.findById(conversationId).populate({ path: "messages", populate: { path: "senderId", select: "_id username" } }).select({ messages: 1 });
    if (previousMessages)
        return previousMessages.messages;
});
exports.default = SocketLib;

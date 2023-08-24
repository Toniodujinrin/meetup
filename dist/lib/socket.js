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
SocketLib.getAllSocketsInRoomWithIds = (io, room) => __awaiter(void 0, void 0, void 0, function* () {
    const clients = yield io.in(room).fetchSockets();
    const ids = clients.map((client) => { return { userId: client.user, socketId: client.id }; });
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
SocketLib.getSocketIdFromUserId = (io, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield io.fetchSockets();
    let socketId;
    client.map((client) => { if (client.user == userId)
        socketId = client.id; });
    return socketId;
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
    const conversation = yield conversations_1.default.findById(conversationId);
    if (!conversation)
        throw new Error("conversation not found");
    let message = new message_1.default({
        conversationId,
        body,
        senderId
    });
    message = yield message.save();
    const msg = yield message_1.default.findById(message._id).populate({ path: "senderId", select: "_id username profilePic" });
    io.to(conversationId).emit("new_message", msg);
    // send notification to all offline users
    const onlineSockets = yield _a.getAllSocketsInRoom(io, conversationId);
    const users = conversation.users;
    const proc = users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        if (!onlineSockets.includes(user)) {
            const usr = yield users_1.default.findById(user);
            if (!usr)
                throw new Error("user not found");
            if (!usr.notifications)
                usr.notifications = [];
            const notificationExists = usr.notifications.find(notification => notification.conversationId == conversationId);
            if (notificationExists) {
                usr.notifications.map(notification => {
                    if (notification.conversationId == conversationId && notification.amount) {
                        notification.amount += 1;
                        notification.timeStamp = Date.now();
                    }
                });
            }
            else
                usr.notifications.unshift({ conversationId, amount: 1, timeStamp: Date.now() });
            usr.notifications.sort((n1, n2) => (n1.timeStamp && n2.timeStamp) ? n2.timeStamp - n1.timeStamp : 0);
            yield usr.updateOne({
                notifications: usr.notifications
            });
            const socketId = yield _a.getSocketIdFromUserId(io, user);
            if (socketId)
                io.to(socketId).emit("new_notification", usr.notifications);
        }
    }));
    yield Promise.all(proc);
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
SocketLib.getPreviousMessages = (conversationId, socket) => __awaiter(void 0, void 0, void 0, function* () {
    let previousMessages = yield conversations_1.default.findById(conversationId).populate("messages");
    if (previousMessages) {
        const messages = previousMessages.messages;
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== socket.user) {
                const proc = messages.map((message) => __awaiter(void 0, void 0, void 0, function* () {
                    if (message.status !== "read") {
                        yield message_1.default.findByIdAndUpdate(message._id, {
                            $set: { status: "read" }
                        });
                    }
                }));
                yield Promise.all(proc);
            }
        }
        const updatedPreviousMessages = yield conversations_1.default.findById(conversationId).populate({ path: "messages", populate: { path: "senderId", select: "_id username profilePic" } });
        return updatedPreviousMessages === null || updatedPreviousMessages === void 0 ? void 0 : updatedPreviousMessages.messages;
    }
});
SocketLib.clearNotifications = (conversationId, socket) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_1.default.findById(socket.user);
    if (!user)
        throw new Error("user not found");
    const notifications = user.notifications.filter(notification => notification.conversationId !== conversationId);
    yield user.updateOne({ notifications });
    socket.emit("notification", notifications);
});
exports.default = SocketLib;

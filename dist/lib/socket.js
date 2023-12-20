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
const helpers_1 = __importDefault(require("./helpers"));
class SocketLib {
}
_a = SocketLib;
SocketLib.getAllSocketsInRoom = (io, room) => __awaiter(void 0, void 0, void 0, function* () {
    const clients = yield io.in(room).fetchSockets();
    const ids = clients.map((client) => {
        return client.user;
    });
    return ids;
});
SocketLib.getAllSocketsInRoomWithIds = (io, room) => __awaiter(void 0, void 0, void 0, function* () {
    const clients = yield io.in(room).fetchSockets();
    const ids = clients.map((client) => {
        return { userId: client.user, socketId: client.id };
    });
    return ids;
});
SocketLib.leaveAllRooms = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        for (let room of socket.rooms) {
            if (room !== socket.id) {
                let ids = yield _a.getAllSocketsInRoom(io, room);
                ids = ids.filter((id) => id !== socket.user);
                io.to(room).emit("onlineUsers", ids);
            }
        }
    }
    catch (error) {
        socket.emit("leave_error", error);
    }
});
SocketLib.leaveRoom = (socket, io, conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield socket.leave(conversationId);
        const ids = yield _a.getAllSocketsInRoom(io, conversationId);
        io.to(conversationId).emit("onlineUsers", ids);
    }
    catch (error) {
        socket.emit("leave_error", error);
    }
});
SocketLib.getAllSockets = (io) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield io.fetchSockets();
    const ids = client.map((client) => {
        return client.user;
    });
    return ids;
});
SocketLib.getSocketIdFromUserId = (io, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield io.fetchSockets();
    let socketId;
    client.map((client) => {
        if (client.user == userId)
            socketId = client.id;
    });
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
        senderId,
    });
    message = yield message.save();
    const _message = yield message.populate({
        path: "senderId",
        select: "_id username profilePic",
    });
    io.to(conversationId).emit("new_message", _message);
    // send notification to users not in conversation
    const onlineSockets = yield _a.getAllSocketsInRoom(io, conversationId);
    const users = conversation.users;
    const proc = users.map((userId) => __awaiter(void 0, void 0, void 0, function* () {
        if (!onlineSockets.includes(userId)) {
            const user = yield users_1.default.findById(userId);
            if (user) {
                if (!user.notifications)
                    user.notifications = [];
                const notificationExists = user.notifications.find((notification) => notification.conversationId == conversationId);
                if (notificationExists) {
                    user.notifications.map((notification) => {
                        if (notification.conversationId == conversationId &&
                            notification.amount) {
                            notification.amount += 1;
                            notification.timeStamp = Date.now();
                        }
                    });
                }
                else
                    user.notifications.unshift({
                        conversationId,
                        amount: 1,
                        timeStamp: Date.now(),
                    });
                user.notifications.sort((n1, n2) => n1.timeStamp && n2.timeStamp ? n2.timeStamp - n1.timeStamp : 0);
                yield user.updateOne({
                    $set: {
                        notifications: user.notifications,
                    },
                });
                const normalizedNotifcations = yield helpers_1.default.getNormalizedNotifications(userId);
                const socketId = yield _a.getSocketIdFromUserId(io, userId);
                if (socketId)
                    io.to(socketId).emit("new_notification", normalizedNotifcations);
            }
        }
    }));
    yield Promise.all(proc);
});
SocketLib.updateLastSeen = (email) => __awaiter(void 0, void 0, void 0, function* () {
    yield users_1.default.findByIdAndUpdate(email, {
        $set: { lastSeen: Date.now() },
    });
});
SocketLib.getUserGroupKey = (email, conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_1.default.findById(email);
    if (user && user.conversations) {
        const conversation = user.conversationKeys.find((conversation) => conversation.conversationId == conversationId);
        if (!conversation)
            throw new Error("unauthorized user");
        return conversation.groupKey;
    }
    throw new Error("invalid user");
});
SocketLib.getPreviousMessages = (conversationId, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let previousMessages = yield conversations_1.default.findById(conversationId).populate("messages");
        if (previousMessages) {
            const messages = previousMessages.messages;
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.senderId !== socket.user) {
                    const proc = messages.map((message) => __awaiter(void 0, void 0, void 0, function* () {
                        if (message.status !== "read") {
                            yield message_1.default.findByIdAndUpdate(message._id, {
                                $set: { status: "read" },
                            });
                        }
                    }));
                    yield Promise.all(proc);
                }
            }
            const updatedPreviousMessages = yield conversations_1.default.findById(conversationId).populate({
                path: "messages",
                populate: {
                    path: "senderId",
                    select: "_id username profilePic defaultProfileColor",
                },
            });
            return updatedPreviousMessages === null || updatedPreviousMessages === void 0 ? void 0 : updatedPreviousMessages.messages;
        }
    }
    catch (error) {
        socket.emit("previousMessages_error", error);
    }
});
SocketLib.clearNotifications = (conversationId, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_1.default.findById(socket.user);
        if (!user)
            throw new Error("user not found");
        const notifications = user.notifications.filter((notification) => notification.conversationId !== conversationId);
        yield user.updateOne({ $set: { notifications } });
        socket.emit("notification", notifications);
    }
    catch (error) {
        socket.emit("clearNotifications_error", error);
    }
});
SocketLib.notifyOnline = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_1.default.findById(socket.user);
        if (!user)
            throw new Error("user not found");
        const process = user.contacts.map((contact) => __awaiter(void 0, void 0, void 0, function* () {
            const socketId = yield _a.getSocketIdFromUserId(io, contact);
            if (socketId) {
                io.to(socketId).emit("newOnlineContact", socket.user);
            }
        }));
        yield Promise.all(process);
    }
    catch (error) {
        socket.emit("notifyOnline_error", error);
    }
});
SocketLib.notifyOffline = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_1.default.findById(socket.user);
        if (!user)
            throw new Error("user not found");
        const process = user.contacts.map((contact) => __awaiter(void 0, void 0, void 0, function* () {
            const socketId = yield _a.getSocketIdFromUserId(io, contact);
            if (socketId) {
                io.to(socketId).emit("newOfflineContact", socket.user);
            }
        }));
        yield Promise.all(process);
    }
    catch (error) {
        socket.emit("notifyOffline_error", error);
    }
});
SocketLib.signalCall = (offer, conversationId, socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversations_1.default.findById(conversationId);
    if (!conversation)
        return socket.emit("offerSignalError", new Error("socket does not exist"));
    if (conversation.type == "group")
        return socket.emit("offerSignalError", new Error("socket does not exist"));
    const receiver = conversation.users.filter((user) => user !== socket.user)[0];
    if (receiver) {
        const recieverSocketId = yield _a.getSocketIdFromUserId(io, receiver);
        if (!recieverSocketId)
            return socket.emit("offerSignalError", new Error("user unavailable"));
        io.to(recieverSocketId).emit("call", { offer, conversationId });
    }
});
SocketLib.signalIceCandidate = (iceCandidate, conversationId, socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversations_1.default.findById(conversationId);
    if (!conversation)
        return socket.emit("iceCandidateSignalError", new Error("socket does not exist"));
    if (conversation.type == "group")
        return socket.emit("iceCandidateSignalError", new Error("socket does not exist"));
    const receiver = conversation.users.filter((user) => user !== socket.user)[0];
    if (receiver) {
        const recieverSocketId = yield _a.getSocketIdFromUserId(io, receiver);
        if (!recieverSocketId)
            return socket.emit("iceCandidateSignalError", new Error("user unavailable"));
        io.to(recieverSocketId).emit("new_iceCandidate", iceCandidate);
    }
});
SocketLib.signalResponse = (answer, conversationId, socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversations_1.default.findById(conversationId);
    if (!conversation)
        return socket.emit("replySignalError", new Error("socket does not exist"));
    if (conversation.type == "group")
        return socket.emit("replySignalError", new Error("socket does not exist"));
    const receiver = conversation.users.filter((user) => user !== socket.user)[0];
    if (receiver) {
        const recieverSocketId = yield _a.getSocketIdFromUserId(io, receiver);
        if (!recieverSocketId)
            return socket.emit("replySignalError", new Error("user unavailable"));
        io.to(recieverSocketId).emit("call_response", answer);
    }
});
SocketLib.rejectCall = (conversationId, io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversations_1.default.findById(conversationId);
    if (!conversation) {
        return socket.emit("rejectCallError", new Error("conversation does not exist"));
    }
    const receiver = conversation.users.filter((user) => user !== socket.user)[0];
    if (receiver) {
        const receiverSocketId = yield _a.getSocketIdFromUserId(io, receiver);
        if (!receiverSocketId) {
            return socket.emit("rejectCallError", new Error("receiver not online"));
        }
        io.to(receiverSocketId).emit("call_rejected");
    }
});
SocketLib.callTimeout = (conversationId, io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversations_1.default.findById(conversationId);
    if (!conversation) {
        return socket.emit("callTimeoutError", new Error("conversation does not exist"));
    }
    const receiver = conversation.users.filter((user) => user !== socket.user)[0];
    if (receiver) {
        const receiverSocketId = yield _a.getSocketIdFromUserId(io, receiver);
        if (!receiverSocketId) {
            return socket.emit("callTimeoutError", new Error("receiver not online"));
        }
        io.to(receiverSocketId).emit("call_timeout");
    }
});
exports.default = SocketLib;

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
class SocketLib {
}
_a = SocketLib;
SocketLib.getAllSockets = (io, room) => __awaiter(void 0, void 0, void 0, function* () {
    const clients = yield io.in(room).fetchSockets();
    const ids = clients.map((client) => { return client.user; });
    return ids;
});
SocketLib.leaveAllRooms = (socket, io) => {
    const rooms = Object.keys(socket.rooms);
    const roomToLeave = rooms.filter(room => room !== socket.id && room !== undefined);
    roomToLeave.forEach((room) => __awaiter(void 0, void 0, void 0, function* () {
        socket.leave(room);
        const ids = yield _a.getAllSockets(io, room);
        io.to(room).emit("online", ids);
    }));
};
// static sendMessage = (io,text,conversationId )=>{
//     //broadcast message then save message to the server 
// }
SocketLib.updateLastSeen = (email) => __awaiter(void 0, void 0, void 0, function* () {
    users_1.default.findByIdAndUpdate(email, {
        $set: { lastSeen: Date.now() }
    });
});
SocketLib.getUserGroupKey = (email, conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_1.default.findById(email);
    if (user && user.conversations) {
        const conversation = user.conversations.find(conversation => conversation.conversationId == conversationId);
        if (!conversation)
            throw new Error("unauthorized user");
        return conversation.groupKey;
    }
    throw new Error("invalid user");
});
SocketLib.getPreviousMessages = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    let previousMessages = yield conversations_1.default.findById(conversationId).populate("messages").select({ messages: 1 });
    if (previousMessages)
        return previousMessages.messages;
});
exports.default = SocketLib;

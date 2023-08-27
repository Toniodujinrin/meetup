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
const mongoose_1 = __importDefault(require("mongoose"));
const conversations_1 = __importDefault(require("./conversations"));
const messageSchema = new mongoose_1.default.Schema({
    conversationId: { type: String, required: true },
    timeStamp: { type: Number, default: Date.now },
    expiry: { type: Number, default: () => { Date.now() + 86400000; } },
    status: { type: String, default: "delivered", enum: ["read", "delivered"] },
    senderId: { type: String, ref: "User" },
    body: String
});
messageSchema.post("save", function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const messageId = doc._id;
            const conversationId = doc.conversationId;
            yield conversations_1.default.findByIdAndUpdate(conversationId, {
                $push: { messages: messageId }
            });
        }
        catch (error) {
            console.log(error);
        }
    });
});
const Message = mongoose_1.default.model("Message", messageSchema);
exports.default = Message;

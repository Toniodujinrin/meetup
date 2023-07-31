"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const conversationSchema = new mongoose_1.default.Schema({
    users: { type: [String], required: true },
    name: { type: String, required: true },
    created: { default: Date.now(), type: Number },
    messages: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Message" }],
    conversationPic: {
        url: { type: String },
        publicId: { type: String }
    }
});
const Conversation = mongoose_1.default.model("Conversation", conversationSchema);
exports.default = Conversation;

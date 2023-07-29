"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    timeStamp: { default: Date.now(), required: true },
    status: { type: String, enum: ["read", "delivered"] },
    conversionId: { type: String, require: true },
    body: String
});
const Message = mongoose_1.default.model("Message", messageSchema);
exports.default = Message;

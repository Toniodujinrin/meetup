"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const usersSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true },
    _id: { type: String, required: true },
    password: { type: String, required: true },
    username: String,
    phone: String,
    firstName: String,
    lastName: String,
    isVerified: { default: false, type: Boolean },
    emailVerified: { default: false, type: Boolean },
    accountVerified: { default: false, type: Boolean },
    lastSeen: { default: Date.now(), type: Number },
    registration: { default: Date.now(), type: Number },
    profilePic: {
        url: String,
        publicId: String
    },
    conversations: [{ conversationId: String, groupKey: String }],
    publicKey: { type: String, required: true }
});
const User = mongoose_1.default.model("User", usersSchema, "users");
exports.default = User;

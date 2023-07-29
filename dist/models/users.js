"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const usersSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    username: { type: String, tim: true, minLength: 3, maxLenght: 15 },
    phone: String,
    firstName: { type: String, trim: true, minLength: 2, maxLength: 15 },
    lastName: { type: String, trim: true, minLength: 2, maxLength: 15 },
    emailVerified: { default: false, type: Boolean },
    accountVerified: { default: false, type: Boolean },
    isVerified: { default: false, type: Boolean },
    lastSeen: { default: Date.now(), type: Number },
    registration: { default: Date.now(), type: Number },
    profilePic: {
        url: String,
        publicId: String
    },
    conversations: [{ conversationId: String, groupKey: String }],
    publicKey: { type: String },
    keyPair: { type: String }
});
const User = mongoose_1.default.model("User", usersSchema, "users");
exports.default = User;

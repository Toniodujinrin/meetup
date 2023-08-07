"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchemas = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const joi_1 = __importDefault(require("joi"));
const usersSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    username: { type: String, tim: true, minLength: 3, maxLenght: 50 },
    phone: String,
    firstName: { type: String, trim: true, minLength: 2, maxLength: 50 },
    lastName: { type: String, trim: true, minLength: 2, maxLength: 50 },
    emailVerified: { default: false, type: Boolean },
    accountVerified: { default: false, type: Boolean },
    contacts: [String],
    isVerified: { default: false, type: Boolean },
    lastSeen: { default: Date.now(), type: Number },
    registration: { default: Date.now(), type: Number },
    profilePic: {
        url: String,
        publicId: String
    },
    bio: {
        type: String,
        minLength: 2,
        maxLength: 120,
    },
    conversations: [{ conversationId: String, groupKey: String }],
    publicKey: { type: String },
    keyPair: { type: String }
});
const User = mongoose_1.default.model("User", usersSchema, "users");
const userSchemas = {
    getUserSchema: joi_1.default.object({
        email: joi_1.default.string().required().email({ minDomainSegments: 2 }).min(2).max(50)
    }),
    createUserSchema: joi_1.default.object({
        email: joi_1.default.string().required().email({ minDomainSegments: 2 }).min(2).max(50),
        password: joi_1.default.string().required().min(3).max(50)
    }),
    verifyAccountSchema: joi_1.default.object({
        username: joi_1.default.string().required().min(2).max(50),
        firstName: joi_1.default.string().required().min(2).max(50),
        lastName: joi_1.default.string().required().min(2).max(50),
        phone: joi_1.default.string().required(),
        bio: joi_1.default.string().required()
    }),
    verifyEmailSchema: joi_1.default.object({
        otp: joi_1.default.string().required().label("OTP")
    }),
    updateUserSchema: joi_1.default.object({
        username: joi_1.default.string().min(2).max(50),
        firstName: joi_1.default.string().min(2).max(50),
        lastName: joi_1.default.string().min(2).max(50),
        phone: joi_1.default.string(),
        bio: joi_1.default.string()
    })
};
exports.userSchemas = userSchemas;
exports.default = User;

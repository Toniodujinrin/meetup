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
exports.userSchemas = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const joi_1 = __importDefault(require("joi"));
const conversations_1 = __importDefault(require("./conversations"));
const message_1 = __importDefault(require("./message"));
const usersSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    username: { type: String, tim: true, minLength: 3, maxLenght: 50 },
    phone: String,
    firstName: { type: String, trim: true, minLength: 2, maxLength: 50 },
    lastName: { type: String, trim: true, minLength: 2, maxLength: 50 },
    emailVerified: { default: false, type: Boolean },
    accountVerified: { default: false, type: Boolean },
    pendingContactsSent: [{ type: String, ref: "User" }],
    pendingContactsReceived: [{ type: String, ref: "User" }],
    contacts: [{ type: String, ref: "User" }],
    isVerified: { default: false, type: Boolean },
    lastSeen: { default: Date.now(), type: Number },
    registration: { default: Date.now(), type: Number },
    profilePic: {
        url: String,
        public_id: String
    },
    bio: {
        type: String,
        minLength: 2,
        maxLength: 120,
    },
    conversations: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Conversation" }],
    conversationKeys: [{ conversationId: String, groupKey: String }],
    publicKey: { type: String },
    keyPair: { type: String },
    notifications: [{ conversationId: { type: String, ref: "Conversation" }, amount: Number, timeStamp: Number }]
});
usersSchema.post("findOneAndDelete", function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //update conversations and contact list 
            const contactProcess = doc.contacts.map((contact) => __awaiter(this, void 0, void 0, function* () {
                const user = yield User.findById(contact);
                if (user) {
                    user.contacts = user.contacts.filter(cont => cont !== doc._id);
                    yield user.updateOne({ $set: { contacts: user.contacts } });
                }
            }));
            yield Promise.all(contactProcess);
            const conversationProcess = doc.conversations.map((conversation) => __awaiter(this, void 0, void 0, function* () {
                const conv = yield conversations_1.default.findById(conversation);
                if (conv) {
                    conv.users = conv.users.filter(user => user !== doc._id);
                    yield conv.updateOne({
                        $set: { users: conv.users }
                    });
                    if (conv.type == "single") {
                        yield conversations_1.default.findByIdAndDelete(conv._id);
                    }
                }
            }));
            yield message_1.default.deleteMany({ senderId: doc._id });
            yield Promise.all(conversationProcess);
        }
        catch (error) {
            console.log(error);
        }
    });
});
const User = mongoose_1.default.model("User", usersSchema, "users");
const userSchemas = {
    searchUserSchema: joi_1.default.object({
        email: joi_1.default.string().required()
    }),
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
    }),
    uploadImageSchema: joi_1.default.object({
        image: joi_1.default.string().required()
    })
};
exports.userSchemas = userSchemas;
exports.default = User;

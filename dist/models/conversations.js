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
exports.conversationSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
const mongoose_1 = __importDefault(require("mongoose"));
const message_1 = __importDefault(require("./message"));
const users_1 = __importDefault(require("./users"));
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
const conversationSchemas = {
    createConversationSchema: joi_1.default.object({
        users: joi_1.default.array().min(1).required(),
        name: joi_1.default.string().required()
    }),
    addUserSchema: joi_1.default.object({
        conversationId: joi_1.default.string().required(),
        users: joi_1.default.array().required(),
        groupKey: joi_1.default.string().required()
    }),
    deleteConversationSchema: joi_1.default.object({
        conversationId: joi_1.default.string().required()
    })
};
exports.conversationSchemas = conversationSchemas;
conversationSchema.pre("deleteOne", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            message_1.default.deleteMany({ conversationId: this._id });
            this.users.map((user) => __awaiter(this, void 0, void 0, function* () {
                const _user = yield users_1.default.findById(user);
                if (_user) {
                    const filteredConversations = _user.conversations.filter(conversation => conversation.conversationId !== this._id);
                    _user.set({
                        conversations: filteredConversations
                    });
                    yield _user.save();
                }
            }));
            next();
        }
        catch (error) {
            console.log(error);
            next();
        }
    });
});
const Conversation = mongoose_1.default.model("Conversation", conversationSchema);
exports.default = Conversation;

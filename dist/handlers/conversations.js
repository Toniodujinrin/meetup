"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const http_status_codes_1 = require("http-status-codes");
const emiters_1 = __importDefault(require("../lib/emiters"));
const conversations_1 = __importStar(require("../models/conversations"));
const encryption_1 = __importDefault(require("../lib/encryption"));
const users_1 = __importDefault(require("../models/users"));
const helpers_1 = __importDefault(require("../lib/helpers"));
const lodash_1 = __importDefault(require("lodash"));
const images_1 = __importDefault(require("../lib/images"));
const { createConversationSchema, addUserSchema, deleteConversationSchema, conversationPicUploadSchema, } = conversations_1.conversationSchemas;
const { conversationEmiter } = emiters_1.default;
const encryption = new encryption_1.default();
conversationEmiter.on("create conversation", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = createConversationSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { users, name, type } = req.body;
        if (users.length > 1 && type == "single")
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("single conversations can only have 2 users");
        if (users.length == 1 && type == "group")
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("group conversations must have more than 2 users");
        if (!helpers_1.default.checkIfSubset(req.user.contacts, users))
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("all users must me be contacts");
        users.push(req.userId);
        const conversationExists = yield conversations_1.default.find({
            users: { $all: users, $size: users.length },
        });
        if (conversationExists.length > 0)
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("conversation between users already exists");
        let conversation = new conversations_1.default({
            users,
            name,
            type,
        });
        conversation = yield conversation.save();
        const conversationId = conversation._id;
        const groupKey = encryption.createGroupKey();
        const process = users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const usr = yield users_1.default.findById(user).select({ publicKey: 1 });
            if (usr && usr.publicKey) {
                const encryptedGroupKey = encryption.encryptGroupKey(usr.publicKey, groupKey);
                const conversationKeyObject = {
                    groupKey: encryptedGroupKey,
                    conversationId,
                };
                yield usr.updateOne({
                    $push: {
                        conversationKeys: conversationKeyObject,
                        conversations: conversationId,
                    },
                });
            }
        }));
        yield Promise.all(process);
        res.status(http_status_codes_1.StatusCodes.OK).send({ status: "success" });
    }
    catch (err) {
        console.log(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
conversationEmiter.on("add to conversation", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = addUserSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { conversationId, users, groupKey } = req.body;
        const conversation = yield conversations_1.default.findById(conversationId);
        if (!conversation)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("conversation not found");
        if (helpers_1.default.checkIfSubset(conversation.users, users))
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("user already exists in conversation");
        if (!helpers_1.default.checkIfSubset(req.user.contacts, users))
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("all users must be contacts");
        const process = users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const usr = yield users_1.default.findById(user);
            if (usr && usr.publicKey) {
                const encryptedGroupKey = encryption.encryptGroupKey(usr.publicKey, groupKey);
                const conversationKeyObject = {
                    groupKey: encryptedGroupKey,
                    conversationId,
                };
                yield usr.updateOne({
                    $push: {
                        conversationKeys: conversationKeyObject,
                        conversations: conversationId,
                    },
                });
                yield conversation.updateOne({
                    $push: { users: user },
                });
            }
        }));
        yield Promise.all(process);
        res.status(http_status_codes_1.StatusCodes.OK).send({ status: "success" });
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
conversationEmiter.on("delete", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = deleteConversationSchema.validate(req.params);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const conversationId = req.params.conversationId;
        const conversation = yield conversations_1.default.findById(conversationId);
        if (!conversation)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("conversation not found");
        if (!conversation.users.includes(req.userId))
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send("you do not belong to this converation");
        yield conversations_1.default.findOneAndDelete({ _id: conversationId });
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
conversationEmiter.on("get conversation", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = deleteConversationSchema.validate(req.params);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { conversationId } = req.params;
        if (!req.user.conversations.includes(conversationId))
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send("you are not allowed to view this conversation");
        let conversation = yield conversations_1.default.findById(conversationId).populate({
            path: "users",
            select: "username _id lastSeen profilePic defaultProfileColor",
        });
        if (!conversation)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("conversation not found");
        let _conversation = lodash_1.default.pick(conversation, [
            "type",
            "users",
            "name",
            "created",
            "conversationPic",
            "lastSeen",
            "_id",
            "defaultConversationColor",
        ]);
        if (_conversation.type == "single") {
            let otherUser = _conversation.users.filter((user) => user._id != req.userId)[0];
            _conversation.name = otherUser.username;
            _conversation.lastSeen = otherUser.lastSeen;
            _conversation.conversationPic = otherUser.profilePic;
            _conversation.defaultConversationColor = otherUser.defaultProfileColor;
        }
        res.status(http_status_codes_1.StatusCodes.OK).json(_conversation);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
conversationEmiter.on("leave conversation", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = deleteConversationSchema.validate(req.params);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { conversationId } = req.params;
        if (!req.user.conversations.includes(conversationId))
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("you cannot leave a conversation you do not belong to ");
        const conversation = yield conversations_1.default.findById(conversationId);
        if (!conversation)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("conversation not found");
        if (conversation.type == "single")
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("cannot leave a 'single' conversation");
        const filteredConversationKeys = req.user.conversationKeys.filter((conversationKey) => conversationKey.conversationId !== conversationId);
        const filteredConversations = req.user.conversations.filter((_conversation) => _conversation.toString() !== conversationId);
        const filteredUsers = conversation.users.filter((user) => user !== req.userId);
        yield req.user.updateOne({
            $set: {
                conversationKeys: filteredConversationKeys,
                conversations: filteredConversations,
            },
        });
        yield conversation.updateOne({
            $set: {
                users: filteredUsers,
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
conversationEmiter.on("conversation pic", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = conversationPicUploadSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { conversationId, image } = req.body;
        const conversation = yield conversations_1.default.findById(conversationId);
        if (!conversation)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .send("conversation does not exist");
        if (conversation.type == "single")
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .send("you cannot upload a conversation picture for single conversations");
        if (!conversation.users.includes(req.userId))
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send("you do not belong to this conversation");
        const imageObject = yield new images_1.default().uploadImage(image, "conversationPictures");
        if (conversation.conversationPic) {
            yield new images_1.default().deleteImage(conversation.conversationPic.public_id);
        }
        yield conversation.updateOne({
            $set: { conversationPic: imageObject },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
conversationEmiter.on("remove conversation pic", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () { }));

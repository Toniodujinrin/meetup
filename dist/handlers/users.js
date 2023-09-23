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
const emiters_1 = __importDefault(require("../lib/emiters"));
const users_1 = __importStar(require("../models/users"));
const otps_1 = __importDefault(require("../models/otps"));
const encryption_1 = __importDefault(require("../lib/encryption"));
const http_status_codes_1 = require("http-status-codes");
const helpers_1 = __importDefault(require("../lib/helpers"));
const images_1 = __importDefault(require("../lib/images"));
const { userEmiter } = emiters_1.default;
const encryption = new encryption_1.default();
const { createUserSchema, verifyAccountSchema, verifyEmailSchema, getUserSchema, updateUserSchema, searchUserSchema, uploadImageSchema } = users_1.userSchemas;
userEmiter.on("get user", ({ params, res }) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = getUserSchema.validate(params);
    if (error)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
    const { email } = params;
    try {
        const user = yield users_1.default.findOne({ _id: email, isVerified: true }).select({ username: 1, firstName: 1, lastName: 1, lastSeen: 1, resgistration: 1, phone: 1, boi: 1, profilePic: 1 });
        if (user)
            res.status(http_status_codes_1.StatusCodes.OK).json(user);
        else
            res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("user not found");
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("get self", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_1.default.findById(req.userId).select({ username: 1, firstName: 1, lastName: 1, lastSeen: 1, registration: 1, phone: 1, bio: 1, profilePic: 1 });
        res.status(http_status_codes_1.StatusCodes.OK).json(user);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("create user", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
            return;
        }
        else {
            const { email, password } = req.body;
            let user = yield users_1.default.findById(email);
            if (user)
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("user already exists");
            const hashedPassword = helpers_1.default.passwordHasher(password);
            user = new users_1.default({
                _id: email,
                password: hashedPassword
            });
            yield user.save();
            const otp = yield helpers_1.default.OTPSender(email, 5);
            if (otp) {
                const otpObject = new otps_1.default({
                    _id: otp,
                    email
                });
                yield otpObject.save();
            }
            const payload = {
                _id: user._id,
                emailVerified: user.emailVerified,
                accountVerified: user.accountVerified,
                isVerified: user.isVerified
            };
            const token = helpers_1.default.generateUserToken(payload);
            res.header("authorization", token).status(http_status_codes_1.StatusCodes.CREATED).json({ status: "success" });
        }
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("verify account", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.emailVerified)
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("email not verified");
    try {
        const { error } = verifyAccountSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { username, firstName, lastName, phone, bio } = req.body;
        const keyPair = encryption.generateKeyPair();
        const publicKey = keyPair.publicKey;
        const encryptedKeyPair = yield encryption.encryptKeyPair(keyPair);
        yield req.user.updateOne({
            $set: {
                isVerified: true,
                accountVerified: true,
                username,
                firstName,
                lastName,
                phone,
                publicKey,
                bio,
                keyPair: encryptedKeyPair
            }
        });
        const token = helpers_1.default.generateUserToken({ _id: req.userId, isVerified: true, emailVerified: true, accountVerified: true });
        res.header("authorization", token).status(http_status_codes_1.StatusCodes.OK).send({ status: "success" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("verify email", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.emailVerified)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("email already verified");
        const { error } = verifyEmailSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { otp } = req.body;
        const otpInDatabase = yield otps_1.default.findById(otp);
        if (otpInDatabase && otpInDatabase.email == req.userId) {
            yield req.user.updateOne({
                $set: {
                    emailVerified: true,
                }
            });
            const token = helpers_1.default.generateUserToken({ _id: req.userId, isVerified: false, emailVerified: true, accountVerified: false });
            res.header("authorization", token).status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
        }
        else
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("Incorrect code");
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("resend otp", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.emailVerified)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("email already verified");
        const otp = yield helpers_1.default.OTPSender(req.userId, 5);
        if (otp) {
            const otpObject = new otps_1.default({
                _id: otp,
                email: req.user
            });
            otpObject.save();
            res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
        }
        else
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error ");
    }
}));
userEmiter.on("get conversations", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield users_1.default.findById(req.userId).populate({ path: "conversations", populate: { path: "messages" } });
        if (!response)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND);
        let editedConversations = response.conversations.map((conversationId) => __awaiter(void 0, void 0, void 0, function* () {
            const normalizedConversation = yield helpers_1.default.normalizeConversation(conversationId, req.userId);
            console.log(normalizedConversation);
            return normalizedConversation;
        }));
        let result = yield Promise.all(editedConversations);
        const resultWithMessages = result.filter(conversation => { if (conversation) {
            return conversation.lastMessage;
        } });
        resultWithMessages.sort((r1, r2) => (r1 && r2 && r1.lastMessage && r2.lastMessage) ? r2.lastMessage.timeStamp - r1.lastMessage.timeStamp : 0);
        const resultWithoutMessages = result.filter(conversation => { if (conversation) {
            return !conversation.lastMessage;
        } });
        result = [...resultWithMessages, ...resultWithoutMessages];
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("add user", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = getUserSchema.validate(req.params);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { email } = req.params;
        if (email == req.userId)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("you cannot add yourself to contacts");
        const user = yield users_1.default.findById(email);
        if (!user)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("user not found");
        if (req.user.pendingContactsSent.includes(email))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("you have already send a request to this user");
        if (req.user.contacts.includes(email))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("user already a contact");
        yield req.user.updateOne({ $push: { pendingContactsSent: email } });
        yield user.updateOne({ $push: { pendingContactsReceived: req.userId } });
        res.status(http_status_codes_1.StatusCodes.OK).send({ status: "success" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("accept Request", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = getUserSchema.validate(req.params);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { email } = req.params;
        const user = yield users_1.default.findById(email);
        if (!user)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("user not found");
        if (!req.user.pendingContactsReceived.includes(email))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("user has not sent you a contact reqquest");
        const pendingContactsReceived = req.user.pendingContactsReceived.filter(item => item != email);
        const pendingContactsSent = user.pendingContactsSent.filter(item => item !== req.userId);
        yield req.user.updateOne({
            $push: { contacts: email },
            $set: { pendingContactsReceived }
        });
        yield user.updateOne({
            $push: { contacts: req.userId },
            $set: { pendingContactsSent }
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("get contacts", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let contacts = yield users_1.default.findById(req.userId).populate({ path: "contacts", select: "username _id profilePic" });
        res.status(http_status_codes_1.StatusCodes.OK).json(contacts === null || contacts === void 0 ? void 0 : contacts.contacts);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("update user", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = updateUserSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        yield req.user.updateOne(req.body);
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("get pending requests sent", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let contacts = yield users_1.default.findById(req.userId).populate({ path: "pendingContactsSent", select: "username _id profilePic" });
        res.status(http_status_codes_1.StatusCodes.OK).json(contacts === null || contacts === void 0 ? void 0 : contacts.pendingContactsSent);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("get pending requests received", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let contacts = yield users_1.default.findById(req.userId).populate({ path: "pendingContactsReceived", select: "username _id profilePic" });
        res.status(http_status_codes_1.StatusCodes.OK).json(contacts === null || contacts === void 0 ? void 0 : contacts.pendingContactsReceived);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("search user", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = searchUserSchema.validate(req.params);
    if (error)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
    const { email } = req.params;
    try {
        const expression = `.*${email}.*`;
        const regex = new RegExp(expression, "g");
        const result = yield users_1.default.find({
            _id: { $regex: regex }, isVerified: true
        }).select({ username: 1, profilePic: 1 });
        res.status(http_status_codes_1.StatusCodes.OK).json(result);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("upload image", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = uploadImageSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { image } = req.body;
        const imageObject = yield new images_1.default().uploadImage(image, "profilePictures");
        if (req.user.profilePic.public_id) {
            yield new images_1.default().deleteImage(req.user.profilePic.public_id);
        }
        yield req.user.updateOne({
            $set: { profilePic: imageObject }
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("delete account", ({ req, res }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield users_1.default.findOneAndDelete({ _id: req.userId });
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));

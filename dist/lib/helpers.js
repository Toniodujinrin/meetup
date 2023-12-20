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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const conversations_1 = __importDefault(require("../models/conversations"));
const users_1 = __importDefault(require("../models/users"));
const lodash_1 = __importDefault(require("lodash"));
class Helpers {
}
_a = Helpers;
Helpers.passwordHasher = (str) => {
    const secret = process.env.HASHING_SECRET;
    if (typeof secret == "string") {
        let hash = crypto_1.default.createHmac("sha256", secret).update(str).digest("hex");
        return hash;
    }
    else {
        throw new Error("hashing secret not found");
    }
};
Helpers.OTPSender = (email, length) => __awaiter(void 0, void 0, void 0, function* () {
    const acceptedchars = "1234567890";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += acceptedchars[Math.floor(Math.random() * acceptedchars.length)];
    }
    const payload = {
        receiver: email,
        subject: "OTP for Sign up",
        from: "Meet Up",
        text: `use this code as your one time password ${result}`,
    };
    try {
        yield axios_1.default.post(`${process.env.EMAIL_SERVER}/send`, payload);
        return result;
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
Helpers.generateUserToken = (payload) => {
    const key = process.env.KEY;
    if (typeof key == "string") {
        const token = `Bearer ${jsonwebtoken_1.default.sign(payload, key)}`;
        return token;
    }
    else
        throw new Error("could not generate token");
};
Helpers.checkIfSubset = (arr1, arr2) => {
    let isSubset = true;
    for (let item of arr2) {
        if (!arr1.includes(item)) {
            isSubset = false;
            break;
        }
    }
    return isSubset;
};
Helpers.normalizeConversation = (conversationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield conversations_1.default.findById(conversationId)
        .populate({ path: "messages" })
        .populate({
        path: "users",
        select: "username _id lastSeen profilePic defaultProfileColor",
    });
    if (!conversation)
        return null;
    let _conversation = lodash_1.default.pick(conversation, [
        "type",
        "users",
        "name",
        "created",
        "conversationPic",
        "lastSeen",
        "_id",
        "defaultConversationColor",
        "lastMessage",
    ]);
    if (_conversation.type == "single") {
        const otherUser = conversation.users.filter((user) => user._id != userId)[0];
        if (!otherUser)
            return null;
        _conversation.name = otherUser.username;
        _conversation.conversationPic = otherUser.profilePic;
        _conversation.lastSeen = otherUser.lastSeen;
        _conversation.defaultConversationColor = otherUser.defaultProfileColor;
    }
    _conversation.lastMessage =
        conversation.messages.length > 0
            ? conversation.messages[conversation.messages.length - 1]
            : undefined;
    return _conversation;
});
Helpers.getNormalizedNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield users_1.default.findById(userId);
    if (user) {
        let normalizedNotifcations = user.notifications.map((notification) => __awaiter(void 0, void 0, void 0, function* () {
            let _notification = {};
            _notification = lodash_1.default.pick(notification, [
                "amount",
                "conversationId",
                "timeStamp",
                "_id",
            ]);
            _notification.conversationDetails = yield _a.normalizeConversation(notification.conversationId, userId);
            return _notification;
        }));
        const _normalizedNotifcations = yield Promise.all(normalizedNotifcations);
        return _normalizedNotifcations;
    }
});
Helpers.generateHexColorString = () => {
    const possibleColors = [
        "#59AB83",
        "#79A470",
        "#AA5CBB",
        "#5CB15F",
        "#6888B5",
        "#B48377",
        "#90A2BF",
        "#6D5CB3",
        "#93816B",
        "#876C8B",
        "#895460",
        "#8CA169",
        "#8B7168",
        "#935269",
        "#6F8ABE",
        "#C7C761",
        "#7069B8",
        "#B3B686",
        "#858FAE",
        "#A898B0",
        "#ACA471",
        "#6B8499",
        "#8367C5",
        "#52B0C4",
        "#B38379",
        "#66A2AB",
        "#BD5D9A",
        "#AE7264",
        "#80915E",
        "#A0535A",
        "#9B8661",
        "#597F65",
        "#C29476",
        "#6D6E57",
        "#6C6984",
        "#7F6E64",
        "#918D5F",
        "#7DBFC5",
        "#AF9D5E",
        "#699795",
        "#A4829F",
        "#75B486",
        "#8E6156",
        "#988563",
        "#76719A",
        "#855EAF",
        "#C1A16A",
        "#C0B2BD",
        "#789C6E",
    ];
    const string = possibleColors[Math.floor(Math.random() * possibleColors.length)];
    return string;
};
exports.default = Helpers;

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
const message_1 = __importDefault(require("../models/message"));
const conversations_1 = __importDefault(require("../models/conversations"));
const otps_1 = __importDefault(require("../models/otps"));
const users_1 = __importDefault(require("../models/users"));
class Processes {
}
_a = Processes;
Processes.envChecker = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Checking environment variables ...");
    const envVariables = [
        process.env.PORT, process.env.MONGO_URI, process.env.KEY, process.env.EMAIL_SERVER, process.env.HASHING_SECRET, process.env.CLOUDINARY_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET,
        process.env.HTTPS, process.env.SERVER_CERT, process.env.SERVER_KEY, process.env.CLOUDINARY_URL
    ];
    for (let i of envVariables) {
        if (!i) {
            console.log("\x1b[31m%s\x1b[0m", "[x] Error: missing environmental properties, exiting ...");
            process.exit(1);
        }
    }
    console.log("\x1b[32m%s\x1b[0m", "[o] All environment variables available ...");
};
Processes.otpProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] OTP process started ...");
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield otps_1.default.deleteMany({ expiry: { $lt: Date.now() } });
    }), 10000);
};
Processes.messageProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Message process started ...");
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield message_1.default.deleteMany({ expiry: { $lt: Date.now() } });
    }), 10000);
};
Processes.conversationProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Conversation process started ...");
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const conversations = yield conversations_1.default.find({ "messages.0": { $exists: true } });
        if (conversations) {
            const conversationProcess = conversations.map((conversation) => __awaiter(void 0, void 0, void 0, function* () {
                const obsoleteMessages = [];
                const findObsoleteMessagesProcess = conversation.messages.map((message) => __awaiter(void 0, void 0, void 0, function* () {
                    if (!(yield message_1.default.findById(message))) {
                        obsoleteMessages.push(message);
                    }
                }));
                yield Promise.all(findObsoleteMessagesProcess);
                const filteredConversationMessages = conversation.messages.filter(message => !obsoleteMessages.includes(message));
                yield conversations_1.default.updateOne({ _id: conversation._id }, { $set: { messages: filteredConversationMessages } });
            }));
            yield Promise.all(conversationProcess);
        }
    }), (1000 * 60 * 5));
};
Processes.notificationProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Notifications process started ...");
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const users = yield users_1.default.find({ "notifications.0": { $exists: true } });
        if (users) {
            const userProcess = users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
                const notifications = user.notifications.filter(notification => { if (notification.timeStamp) {
                    return notification.timeStamp + 86400000 > Date.now();
                } });
                yield user.updateOne({
                    notifications
                });
            }));
            yield Promise.all(userProcess);
        }
    }), 10000);
};
exports.default = Processes;

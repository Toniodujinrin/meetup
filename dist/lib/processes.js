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
const otps_1 = __importDefault(require("../models/otps"));
class Processes {
}
_a = Processes;
Processes.envChecker = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Checking environment variables ...");
    if (process.env.PORT && process.env.MONGO_URI && process.env.KEY, process.env.EMAIL_SERVER, process.env.HASHING_SECRET) {
        console.log("\x1b[32m%s\x1b[0m", "[o] All environment variables available ...");
    }
    else {
        console.log("\x1b[31m%s\x1b[0m", "[x] Error: missing environmental properties, exiting ...");
        process.exit(1);
    }
};
Processes.otpProcess = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\x1b[33m%s\x1b[0m", "[+] OTP process started ...");
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield otps_1.default.deleteMany({ expiry: { $lt: Date.now() } });
    }), 10000);
});
Processes.messageProcess = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\x1b[33m%s\x1b[0m", "[+] Message process started ...");
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield message_1.default.deleteMany({ expiry: { $lt: Date.now() } });
    }), 10000);
});
exports.default = Processes;

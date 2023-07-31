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
        text: `use this code as your one time password ${result}`
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
exports.default = Helpers;

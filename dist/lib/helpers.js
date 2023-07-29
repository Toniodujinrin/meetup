"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
class Helpers {
}
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
exports.default = Helpers;

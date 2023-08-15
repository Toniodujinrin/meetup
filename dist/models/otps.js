"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const otpSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true, minLength: 5, maxLength: 5 },
    expiry: { type: Number, default: Date.now() + 300000 },
    email: { type: String, required: true }
});
const OTP = mongoose_1.default.model("OTP", otpSchema);
exports.default = OTP;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const userSchemas = {
    createUserSchema: joi_1.default.object({
        email: joi_1.default.string().required().email({ minDomainSegments: 2 }),
        password: joi_1.default.string().required().min(3).max(30)
    }),
    verifyAccountSchema: joi_1.default.object({
        username: joi_1.default.string().required().min(2).max(15),
        firstName: joi_1.default.string().required().min(2).max(15),
        lastName: joi_1.default.string().required().min(2).max(15),
        phone: joi_1.default.string().required()
    }),
    verifyEmailSchema: joi_1.default.object({
        otp: joi_1.default.string().required().label("OTP")
    })
};
exports.default = userSchemas;

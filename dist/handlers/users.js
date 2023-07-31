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
const http_status_codes_1 = require("http-status-codes");
const helpers_1 = __importDefault(require("../lib/helpers"));
const { userEmiter } = emiters_1.default;
const { createUserSchema, verifyAccountSchema, verifyEmailSchema, getUserSchema } = users_1.userSchemas;
userEmiter.on("get user", (args) => {
    const { email, res } = args[0];
    const { error } = getUserSchema.validate(email);
    if (error)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
    res.send(email);
});
userEmiter.on("create user", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { body, res } = args[0];
    try {
        const { error } = createUserSchema.validate(body);
        if (error) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
            return;
        }
        else {
            const { email, password } = body;
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
            res.status(http_status_codes_1.StatusCodes.CREATED).send("user profile created");
        }
    }
    catch (err) {
        console.log(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error ");
    }
}));
userEmiter.on("verify account", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { body, res } = args[0];
    try {
        const { error } = verifyAccountSchema.validate(body);
    }
    catch (error) {
    }
}));
userEmiter.on("verify email", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { body, res } = args[0];
}));

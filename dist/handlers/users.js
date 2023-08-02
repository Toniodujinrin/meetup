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
const { userEmiter } = emiters_1.default;
const encryption = new encryption_1.default();
const { createUserSchema, verifyAccountSchema, verifyEmailSchema, getUserSchema } = users_1.userSchemas;
userEmiter.on("get user", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { params, res } = args[0];
    const { error } = getUserSchema.validate(params);
    if (error)
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
    const { email } = params;
    const user = yield users_1.default.findOne({ _id: email, isVerified: true }).select({ username: 1, firstName: 1, lastName: 1, lastSeen: 1, resgistration: 1, phone: 1, conversations: 1 });
    if (user)
        res.status(http_status_codes_1.StatusCodes.OK).json(user);
    else
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("user not found");
}));
userEmiter.on("create user", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { req, res } = args[0];
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
userEmiter.on("verify account", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { req, res } = args[0];
    if (!req.emailVerified)
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("email not verified");
    try {
        const { error } = verifyAccountSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        else {
            const { username, firstName, lastName, phone } = req.body;
            const keyPair = yield encryption.generateKeyPair();
            const publicKey = keyPair.publicKey;
            const encryptedKeyPair = yield encryption.encryptKeyPair(keyPair);
            const user = yield users_1.default.findByIdAndUpdate(req.user, {
                $set: {
                    isVerified: true,
                    accountVerified: true,
                    username,
                    firstName,
                    lastName,
                    phone,
                    publicKey,
                    keyPair: encryptedKeyPair
                }
            }, { new: true }).select({ accountVerified: 1, emailVerified: 1, isVerified: 1 });
            if (user) {
                const token = helpers_1.default.generateUserToken(user.toJSON());
                res.header("authorization", token).status(http_status_codes_1.StatusCodes.OK).send({ status: "success" });
            }
            else
                res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("user not found");
        }
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("verify email", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { req, res } = args[0];
    try {
        if (req.emailVerified)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("email already verified");
        const { error } = verifyEmailSchema.validate(req.body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        else {
            const { otp } = req.body;
            const otpInDatabase = yield otps_1.default.findById(otp);
            if (otpInDatabase && otpInDatabase.email == req.user && otpInDatabase.expiry <= Date.now()) {
                const user = yield users_1.default.findByIdAndUpdate(req.user, {
                    $set: {
                        emailVerified: true,
                    }
                }, { new: true }).select({ isVerified: 1, accountVerified: 1, emailVerified: 1 });
                if (user) {
                    const token = helpers_1.default.generateUserToken(user.toJSON());
                    res.header("authorization", token).status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
                }
                else
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).send("user not found");
            }
            else
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("Incorrect code");
        }
    }
    catch (_a) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));
userEmiter.on("resend otp", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { req, res } = args[0];
    try {
        if (req.emailVerified)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("email already verified");
        const otp = yield helpers_1.default.OTPSender(req.user, 5);
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
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("server error ");
    }
}));

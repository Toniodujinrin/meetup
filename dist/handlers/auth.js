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
const http_status_codes_1 = require("http-status-codes");
const emiters_1 = __importDefault(require("../lib/emiters"));
const users_1 = __importStar(require("../models/users"));
const lodash_1 = __importDefault(require("lodash"));
const encryption_1 = __importDefault(require("../lib/encryption"));
const helpers_1 = __importDefault(require("../lib/helpers"));
const { authenticationEmiter } = emiters_1.default;
const encryption = new encryption_1.default();
const { createUserSchema } = users_1.userSchemas;
authenticationEmiter.on("authenticate", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { body, res } = args[0];
    try {
        const { error } = createUserSchema.validate(body);
        if (error)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
        const { email, password } = body;
        const user = yield users_1.default.findById(email).select({
            isVerified: 1, emailVerified: 1, accountVerified: 1, password: 1, keyPair: 1
        });
        if (!user)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("Invalid username or password");
        const hashedPassword = helpers_1.default.passwordHasher(password);
        if (hashedPassword !== user.password)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("Invalid username or password");
        const _user = lodash_1.default.omit(user.toJSON(), ["password"]);
        if (user.keyPair) {
            const decryptedKeyPair = yield encryption.decryptKeyPair(user.keyPair);
            _user.keyPair = decryptedKeyPair;
        }
        const token = helpers_1.default.generateUserToken(_user);
        res.header("authorization", token);
        return res.status(http_status_codes_1.StatusCodes.OK).json({ status: "success" });
    }
    catch (err) {
        console.log(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
}));

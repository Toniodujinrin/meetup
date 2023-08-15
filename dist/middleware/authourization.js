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
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const authorization = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token = req.headers.authorization;
    const key = process.env.KEY;
    if (token && typeof key == "string") {
        try {
            token = token.replace("Bearer", "").trim();
            const payload = jsonwebtoken_1.default.verify(token, key);
            const user = yield users_1.default.findById(payload._id);
            if (user) {
                req.user = user;
                req.userId = user._id;
                req.isVerified = user.isVerified;
                req.emailVerified = user.emailVerified;
                req.accountVerified = user.accountVerified;
                next();
            }
            else
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("invalid token");
        }
        catch (err) {
            console.log(err);
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("Invalid token");
        }
    }
    else
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("No authorization token recieved ");
});
exports.default = authorization;

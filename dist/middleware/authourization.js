"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authorization = (req, res, next) => {
    let token = req.headers.authorization;
    const key = process.env.KEY;
    if (token && typeof key == "string") {
        try {
            token = token.replace("Bearer", "").trim();
            const payload = jsonwebtoken_1.default.verify(token, key);
            req.user = payload._id;
            req.isVerified = payload.isVerified;
            req.emailVerified = payload.emailVerified;
            req.accountVerified = payload.accountVerified;
            next();
        }
        catch (err) {
            console.log(err);
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("Invalid token");
        }
    }
    else
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("No authorization token recieved ");
};
exports.default = authorization;

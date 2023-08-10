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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const authorization = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token = socket.handshake.auth.token;
    const key = process.env.KEY;
    if (token && typeof key == "string") {
        try {
            token = token.replace("Bearer", "").trim();
            const payload = jsonwebtoken_1.default.verify(token, key);
            const user = yield users_1.default.findById(payload._id);
            if (user && user.isVerified) {
                socket.user = user._id;
                next();
            }
            else
                return socket.emit("conn_error", new Error("not authorized"));
        }
        catch (err) {
            socket.emit("conn_error", new Error("server error"));
        }
    }
    else
        socket.emit("conn_error", new Error("invalid token"));
});
exports.default = authorization;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("../routes/users"));
const auth_1 = __importDefault(require("../routes/auth"));
const conversations_1 = __importDefault(require("../routes/conversations"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const startup = (app) => {
    app.use(express_1.default.static("public"));
    app.use((0, cors_1.default)({
        exposedHeaders: ["authorization"]
    }));
    app.use(body_parser_1.default.json({ limit: "50mb" }));
    app.use(body_parser_1.default.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    }));
    app.use(express_1.default.json());
    app.use("/api/users", users_1.default);
    app.use("/api/auth", auth_1.default);
    app.use("/api/conversations", conversations_1.default);
};
exports.default = startup;

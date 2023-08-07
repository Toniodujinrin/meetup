"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const emiters = {
    userEmiter: new events_1.default(),
    messageEmmiter: new events_1.default(),
    authenticationEmiter: new events_1.default(),
    conversationEmiter: new events_1.default()
};
exports.default = emiters;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authourization_1 = __importDefault(require("../middleware/authourization"));
const restriction_1 = __importDefault(require("../middleware/restriction"));
require("../handlers/conversations");
const emiters_1 = __importDefault(require("../lib/emiters"));
const { conversationEmiter } = emiters_1.default;
const router = express_1.default.Router();
router.post("/", authourization_1.default, restriction_1.default, (req, res) => {
    conversationEmiter.emit("create conversation", { req, res });
});
router.post("/add", authourization_1.default, restriction_1.default, (req, res) => {
    conversationEmiter.emit("add to conversation", { req, res });
});
router.delete("/:conversationId", authourization_1.default, restriction_1.default, (req, res) => {
    conversationEmiter.emit("delete", { req, res });
});
exports.default = router;

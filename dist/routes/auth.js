"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emiters_1 = __importDefault(require("../lib/emiters"));
require("../handlers/auth");
const router = express_1.default.Router();
const { authenticationEmiter } = emiters_1.default;
router.post("/", (req, res) => {
    authenticationEmiter.emit("authenticate", [{ body: req.body, res }]);
});
exports.default = router;

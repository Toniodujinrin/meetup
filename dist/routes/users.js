"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emiters_1 = __importDefault(require("../lib/emiters"));
require("../handlers/users");
const { userEmiter } = emiters_1.default;
const router = express_1.default.Router();
router.use(function (req, res, next) {
    next();
});
router.get('/:email', (req, res) => {
    userEmiter.emit("get user", [{ email: req.params.email, res }]);
});
router.post("/verifyAccount", (req, res) => {
    userEmiter.emit("verify account", [{ body: req.body, res }]);
});
router.post("/", (req, res) => {
    userEmiter.emit("create user", [{ body: req.body, res }]);
});
exports.default = router;

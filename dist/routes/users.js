"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emiters_1 = __importDefault(require("../lib/emiters"));
require("../handlers/users");
const router = express_1.default.Router();
router.use(function (req, res, next) {
    next();
});
router.get('/:email', (req, res) => {
    emiters_1.default.userEmiter.emit("get user", [{ email: req.params.email, res: res }]);
});
router.post("/", (req, res) => {
    emiters_1.default.userEmiter.emit("create user", [{ body: req.body, res: res }]);
});
exports.default = router;

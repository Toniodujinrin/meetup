"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emiters_1 = __importDefault(require("../lib/emiters"));
require("../handlers/users");
const authourization_1 = __importDefault(require("../middleware/authourization"));
const { userEmiter } = emiters_1.default;
const router = express_1.default.Router();
router.use(function (req, res, next) {
    next();
});
router.get('/:email', (req, res) => {
    userEmiter.emit("get user", [{ params: req.params, res }]);
});
router.post("/verifyAccount", authourization_1.default, (req, res) => {
    userEmiter.emit("verify account", [{ req, res }]);
});
router.post("/verifyEmail", authourization_1.default, (req, res) => {
    userEmiter.emit("verify email", [{ req, res }]);
});
router.post("/", (req, res) => {
    userEmiter.emit("create user", [{ req, res }]);
});
router.post("/resendOtp", authourization_1.default, (req, res) => {
    userEmiter.emit("resend otp", [{ req, res }]);
});
exports.default = router;

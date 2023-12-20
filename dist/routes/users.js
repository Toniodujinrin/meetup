"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emiters_1 = __importDefault(require("../lib/emiters"));
require("../handlers/users");
const restriction_1 = __importDefault(require("../middleware/restriction"));
const authourization_1 = __importDefault(require("../middleware/authourization"));
const { userEmiter } = emiters_1.default;
const router = express_1.default.Router();
router.get("/contacts", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("get contacts", { req, res });
});
router.get("/searchUser/:email", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("search user", { req, res });
});
router.get("/conversations", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("get conversations", { req, res });
});
router.get("/self", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("get self", { req, res });
});
router.get("/pending/sent", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("get pending requests sent", { req, res });
});
router.get("/pending/received", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("get pending requests received", { req, res });
});
router.get("/notifications", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("get notifications", { req, res });
});
router.get("/:email", (req, res) => {
    userEmiter.emit("get user", { params: req.params, res });
});
router.post("/uploadImage", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("upload image", { req, res });
});
router.post("/verifyAccount", authourization_1.default, (req, res) => {
    userEmiter.emit("verify account", { req, res });
});
router.post("/verifyEmail", authourization_1.default, (req, res) => {
    userEmiter.emit("verify email", { req, res });
});
router.post("/add/:email", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("add user", { req, res });
});
router.post("/resendOtp", authourization_1.default, (req, res) => {
    userEmiter.emit("resend otp", { req, res });
});
router.post("/accept/:email", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("accept Request", { req, res });
});
router.post("/", (req, res) => {
    userEmiter.emit("create user", { req, res });
});
router.put("/", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("update user", { req, res });
});
router.delete("/removeProfilePic", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("remove profile pic", { req, res });
});
router.delete("/", authourization_1.default, restriction_1.default, (req, res) => {
    userEmiter.emit("delete account", { req, res });
});
exports.default = router;

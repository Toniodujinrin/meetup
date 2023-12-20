import express from "express";
import emiter from "../lib/emiters";
import "../handlers/users";
import restriction from "../middleware/restriction";
import authorization from "../middleware/authourization";
const { userEmiter } = emiter;
const router = express.Router();

router.get("/contacts", authorization, restriction, (req, res) => {
  userEmiter.emit("get contacts", { req, res });
});
router.get("/searchUser/:email", authorization, restriction, (req, res) => {
  userEmiter.emit("search user", { req, res });
});
router.get("/conversations", authorization, restriction, (req, res) => {
  userEmiter.emit("get conversations", { req, res });
});
router.get("/self", authorization, restriction, (req, res) => {
  userEmiter.emit("get self", { req, res });
});
router.get("/pending/sent", authorization, restriction, (req, res) => {
  userEmiter.emit("get pending requests sent", { req, res });
});
router.get("/pending/received", authorization, restriction, (req, res) => {
  userEmiter.emit("get pending requests received", { req, res });
});
router.get("/notifications", authorization, restriction, (req, res) => {
  userEmiter.emit("get notifications", { req, res });
});
router.get("/:email", (req, res) => {
  userEmiter.emit("get user", { params: req.params, res });
});

router.post("/uploadImage", authorization, restriction, (req, res) => {
  userEmiter.emit("upload image", { req, res });
});
router.post("/verifyAccount", authorization, (req, res) => {
  userEmiter.emit("verify account", { req, res });
});
router.post("/verifyEmail", authorization, (req, res) => {
  userEmiter.emit("verify email", { req, res });
});
router.post("/add/:email", authorization, restriction, (req, res) => {
  userEmiter.emit("add user", { req, res });
});
router.post("/resendOtp", authorization, (req, res) => {
  userEmiter.emit("resend otp", { req, res });
});
router.post("/accept/:email", authorization, restriction, (req, res) => {
  userEmiter.emit("accept Request", { req, res });
});
router.post("/", (req, res) => {
  userEmiter.emit("create user", { req, res });
});
router.put("/", authorization, restriction, (req, res) => {
  userEmiter.emit("update user", { req, res });
});
router.delete("/deleteImage", authorization, restriction, (req, res) => {
  userEmiter.emit("remove image", { req, res });
});
router.delete("/", authorization, restriction, (req, res) => {
  userEmiter.emit("delete account", { req, res });
});

export default router;

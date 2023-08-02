import express from "express"
import emiter from "../lib/emiters"
import "../handlers/users"
import restriction from "../middleware/restriction"
import authorization from "../middleware/authourization"
const {userEmiter}= emiter
const router = express.Router()
router.use(function(req,res,next){
    next()
})

router.get('/:email',  (req,res)=>{
    userEmiter.emit("get user",[{params:req.params,res}])
})
router.post("/verifyAccount",authorization,(req,res)=>{
    userEmiter.emit("verify account", [{req, res}])
})
router.post("/verifyEmail", authorization,(req, res)=>{
    userEmiter.emit("verify email",[{req, res}])
})
router.post("/", (req,res)=>{
    userEmiter.emit("create user", [{req,res}])
})
router.post("/resendOtp", authorization, (req, res)=>{
    userEmiter.emit("resend otp", [{req, res}])
})







export default router
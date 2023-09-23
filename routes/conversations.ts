import express from "express"
import authorization from "../middleware/authourization"
import restriction from "../middleware/restriction"
import "../handlers/conversations"
import emiters from "../lib/emiters"
const {conversationEmiter}= emiters
const router = express.Router()


router.get("/:conversationId",authorization,restriction,(req,res)=>{
  conversationEmiter.emit("get conversation",{req, res})
})
router.post("/",authorization, restriction, (req, res)=>{
  conversationEmiter.emit("create conversation",{req, res})
})

router.post("/add", authorization,restriction, (req, res)=>{
  conversationEmiter.emit("add to conversation", {req, res})
})

router.post("/conversationPic", authorization, restriction, (req,res)=>{
  conversationEmiter.emit("conversation pic", {req,res})
})

router.post("/leave/:conversationId", authorization, restriction, (req,res)=>{
  conversationEmiter.emit("leave conversation", {req,res})
})

router.delete("/:conversationId",authorization, restriction, (req, res)=>{
  conversationEmiter.emit("delete", {req,res})
})


export default router
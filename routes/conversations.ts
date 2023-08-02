import express from "express"
import authorization from "../middleware/authourization"
import restriction from "../middleware/restriction"
import emiters from "../lib/emiters"
const {conversationEmiter}= emiters
const router = express.Router()



router.post("/",authorization, restriction, (req, res)=>{
  conversationEmiter.emit("create coversation",[{req, res}])
})

export default router
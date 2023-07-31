import express from "express"
import emiter from "../lib/emiters"
import "../handlers/users"
const {userEmiter}= emiter
const router = express.Router()
router.use(function(req,res,next){
    next()
})

router.get('/:email', (req,res)=>{
    userEmiter.emit("get user",[{email:req.params.email,res}])
})
router.post("/verifyAccount",(req,res)=>{
    userEmiter.emit("verify account", [{body:req.body, res}])
})
router.post("/", (req,res)=>{
    userEmiter.emit("create user", [{body:req.body,res}])
})








export default router
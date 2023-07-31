import express from "express"
import emiters from "../lib/emiters"
import "../handlers/auth"

const router = express.Router()
const {authenticationEmiter} = emiters

router.post("/",(req,res)=>{
    
   authenticationEmiter.emit("authenticate",[{body:req.body, res}])
})


export default router
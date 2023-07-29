import express from "express"
import emiter from "../lib/emiters"
import "../handlers/users"


const router = express.Router()
router.use(function(req,res,next){
    next()
})

router.get('/:email', (req,res)=>{
    emiter.userEmiter.emit("get user",[{email:req.params.email, res:res}])
})

router.post("/", (req,res)=>{
    
    emiter.userEmiter.emit("create user", [{body:req.body,res:res}])

})








export default router
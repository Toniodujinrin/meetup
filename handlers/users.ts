import emiter from "../lib/emiters";
import userSchemas from "../validators/users";
import User from "../models/users";

import { StatusCodes } from "http-status-codes";
import Helpers from "../lib/helpers"

const {userEmiter }= emiter

userEmiter.on("get user",(args)=>{
    const {email,res} = args[0]
    res.send(email)
})


userEmiter.on("create user", async (args)=>{
    const{body,res} = args[0]
    try{
    const {error} = userSchemas.createUserSchema.validate(body)
    if(error){
        res.status(StatusCodes.BAD_REQUEST).send(error.message)
        return 
    }
    else{
        const {email,password}= body
        const hashedPassword = Helpers.passwordHasher(password)
        const user = new User({
            _id:email,
            password:hashedPassword
        })
        await user.save()
        res.status(StatusCodes.CREATED).send("user profile created")
    }
   }
   catch (err){
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error ")
   }
})










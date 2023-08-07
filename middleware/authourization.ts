import { NextFunction,Request,Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken"
import User from "../models/users";



const authorization = async (req:any,res:Response,next:NextFunction)=>{
    let token = req.headers.authorization
    const key = process.env.KEY
    if(token && typeof key =="string"){
      try{
        token = token.replace("Bearer","").trim()
        const payload:any = jwt.verify(token,key)
        const user = await User.findById(payload._id)
        if(user){
          req.user = payload._id 
          req.isVerified = payload.isVerified
          req.emailVerified = payload.emailVerified
          req.accountVerified = payload.accountVerified
          next()
        }
        else return res.status(StatusCodes.UNAUTHORIZED).send("invalid token")
      }
      catch(err){
        console.log(err)
        res.status(StatusCodes.UNAUTHORIZED).send("Invalid token")
      }
    }
    else res.status(StatusCodes.UNAUTHORIZED).send("No authorization token recieved ")
    
    
}

export default authorization
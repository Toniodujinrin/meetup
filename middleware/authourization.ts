import { NextFunction,Request,Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken"



const authorization = (req:any,res:Response,next:NextFunction)=>{
    let token = req.headers.authorization
    const key = process.env.KEY
    if(token && typeof key =="string"){
      try{
        token = token.replace("Bearer","").trim()
        const payload:any = jwt.verify(token,key)
        req.user = payload._id 
        req.isVerified = payload.isVerified
        req.emailVerified = payload.emailVerified
        req.accountVerified = payload.accountVerified
        next()
      }
      catch(err){
        console.log(err)
        res.status(StatusCodes.UNAUTHORIZED).send("Invalid token")
      }
    }
    else res.status(StatusCodes.UNAUTHORIZED).send("No authorization token recieved ")
    
    
}

export default authorization
import { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { RequestInterface } from "../lib/types";

const restriction = (req:any, res:Response, next:NextFunction)=>{
    if(req.isVerified){
        next()
    }
    else{
        
        res.status(StatusCodes.UNAUTHORIZED).send("you are not authorized to perform this action")
    }
}

export default restriction
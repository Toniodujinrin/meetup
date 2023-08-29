import mongoose from "mongoose";
import Joi from "joi";
import { ObjectId } from "mongodb";



const usersSchema = new mongoose.Schema({
    _id:{type:String, required:true, trim:true},
    password:{type:String, required:true},
    username:{type:String, tim:true, minLength:3, maxLenght:50}, 
    phone:String, 
    firstName:{type:String, trim:true, minLength:2,maxLength:50 }, 
    lastName:{type:String, trim:true, minLength:2,maxLength:50 },  
    emailVerified:{default:false, type:Boolean},
    accountVerified:{default:false, type:Boolean},
    pendingContactsSent : [{type:String, ref:"User"}],
    pendingContactsReceived :[{type:String, ref:"User"}],
    contacts :[{type:String, ref:"User"}],
    isVerified:{default:false, type:Boolean} ,
    lastSeen:{default:Date.now(), type:Number},
    registration:{default:Date.now(), type:Number},
    profilePic:{
        url:String, 
        public_id:String
    },
    bio:{
       type:String, 
       minLength:2, 
       maxLength:120,
    },
    conversations:[{type:mongoose.Schema.Types.ObjectId, ref:"Conversation"}],
    conversationKeys:[{conversationId:String, groupKey:String}],
    publicKey:{type:String},
    keyPair:{type:String},
    notifications:[{conversationId:{type:String, ref:"Conversation"},amount:Number,timeStamp:Number}]
})







const User = mongoose.model("User",usersSchema,"users")

const userSchemas = {
    searchUserSchema:Joi.object({
        email:Joi.string().required()
    }),
    getUserSchema:Joi.object({
       email:Joi.string().required().email({minDomainSegments:2}).min(2).max(50)
    }),
    createUserSchema : Joi.object({
        email:Joi.string().required().email({minDomainSegments:2}).min(2).max(50),
        password:Joi.string().required().min(3).max(50)
    }),
    verifyAccountSchema: Joi.object({
        username:Joi.string().required().min(2).max(50),
        firstName:Joi.string().required().min(2).max(50),
        lastName:Joi.string().required().min(2).max(50), 
        phone:Joi.string().required(),
        bio:Joi.string().required()
    }),
    verifyEmailSchema: Joi.object({
        otp:Joi.string().required().label("OTP")
    }),
    updateUserSchema: Joi.object({
        username:Joi.string().min(2).max(50),
        firstName:Joi.string().min(2).max(50),
        lastName:Joi.string().min(2).max(50), 
        phone:Joi.string(),
        bio:Joi.string()
    }),
    uploadImageSchema:Joi.object({
        image:Joi.string().required()
    })
}





export {userSchemas}
export default User 


import mongoose from "mongoose";
import joi, { required } from "joi"
const usersSchema = new mongoose.Schema({
    email:{type:String, required:true}, 
    _id:{type:String, required:true},
    password:{type:String, required:true},
    username:String, 
    phone:String, 
    firstName:String, 
    lastName:String, 
    isVerified:{default:false, type:Boolean} ,
    emailVerified:{default:false, type:Boolean},
    accountVerified:{default:false, type:Boolean},
    lastSeen:{default:Date.now(), type:Number},
    registration:{default:Date.now(), type:Number},
    profilePic:{
        url:String, 
        publicId:String
    },
    conversations:[{conversationId:String, groupKey:String}],
    publicKey:{type:String, required:true}
})



const User = mongoose.model("User",usersSchema,"users")




export default User 


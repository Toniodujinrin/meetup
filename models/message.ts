import mongoose from "mongoose";
import Conversation from "./conversations";

const messageSchema = new mongoose.Schema({
    timeStamp:{type:Number, default:Date.now(), required:true }, 
    status:{type:String, default:"delivered",  enum:["read","delivered"]},
    body:String 
})
const Message = mongoose.model("Message",messageSchema)

export default Message
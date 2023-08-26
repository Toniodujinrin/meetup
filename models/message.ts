import mongoose from "mongoose";
import Conversation from "./conversations";
import { MessageInterface } from "../lib/types";



const messageSchema = new mongoose.Schema({
    conversationId:{type:String, required:true},
    timeStamp:{type:Number, default:Date.now }, 
    expiry:{type:Number, default:Date.now()+86400000},
    status:{type:String, default:"delivered",  enum:["read","delivered"]},
    senderId:{type:String, ref:"User"},
    body:String
})


messageSchema.post<MessageInterface>("save", async function(doc){
    try {
        const messageId = doc._id
        const conversationId = doc.conversationId
        await Conversation.findByIdAndUpdate(conversationId,{
            $push:{messages:messageId}
        })
    } catch (error) {
        console.log(error)
    }
})


const Message = mongoose.model("Message",messageSchema)



export default Message
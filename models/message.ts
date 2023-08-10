import mongoose from "mongoose";
import Conversation from "./conversations";


interface MessageInterface extends mongoose.Document{
    conversationId:string,
    timeStamp:number, 
    status:string,
    body:String 
}

const messageSchema = new mongoose.Schema({
    conversationId:{type:String, required:true},
    timeStamp:{type:Number, default:Date.now() }, 
    expiry:{type:Number, default:Date.now()+86400000},
    status:{type:String, default:"delivered",  enum:["read","delivered"]},
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

messageSchema.pre<MessageInterface>("deleteMany",async function(next){
    try{
       const messageId = this._id
       const conversationId = this.conversationId
       const conversation = await Conversation.findById(conversationId)
       if(conversation){
        const newMessages= conversation.messages.filter(message => message !== messageId)
        conversation.set({
            messages:newMessages
        })
        await conversation.save()
        }
    }
    catch(error){
        next()
    }
})
const Message = mongoose.model("Message",messageSchema)



export default Message
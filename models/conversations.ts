import Joi from "joi";
import mongoose from "mongoose";
import Message from "./message";
import User from "./users";
import { Model } from "mongoose";
import { ConversationInterface } from "../lib/types";



const conversationSchema = new mongoose.Schema<ConversationInterface,Model<ConversationInterface>>({
   users:[{type:String, ref:"User"}],
   type:{type:String, enum:["group","single"]},
   name:{type:String},
   created:{default:Date.now(), type:Number},
   messages:[{type:mongoose.Schema.Types.ObjectId, ref:"Message"}],
   conversationPic:{
    url:{type:String},
    public_id:{type:String}
   },
   lastSeen:{type:Number}
})

const conversationSchemas = {
   createConversationSchema : Joi.object({
      type:Joi.string().required(),
      users:Joi.array().min(1).required(),
      name:Joi.string()
   }),
   addUserSchema:Joi.object({
      conversationId: Joi.string().required(),
      users:Joi.array().required(),
      groupKey:Joi.string().required()
   }),
   deleteConversationSchema:Joi.object({
      conversationId:Joi.string().required()
   })
}

conversationSchema.post<ConversationInterface>("findOneAndDelete",async function(doc:ConversationInterface){
   try{
      Message.deleteMany({conversationId:doc._id})
      const proc = doc.users.map(async(user) => {
         const _user = await  User.findById(user)
         if(_user){
            const filteredConversations = _user.conversations.filter((conversation:any) => !doc._id.equals(conversation))
            const filteredConversationKeys = _user.conversationKeys.filter(conversation=> !doc._id.equals(conversation.conversationId))
            _user.set({
               conversations:filteredConversations,
               conversationKeys:filteredConversationKeys
            })
           await _user.save()
         }
      });
      await Promise.all(proc)
   }
   catch (error){
     console.log(error)
   }
})



const Conversation = mongoose.model("Conversation",conversationSchema)


export {conversationSchemas}
export default Conversation





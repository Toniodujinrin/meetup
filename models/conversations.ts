import Joi from "joi";
import mongoose from "mongoose";
import Message from "./message";
import User from "./users";
import { filter } from "lodash";

interface ConversationInterface extends mongoose.Document{
   _id:string 
   users:string[]
   name:string
   created:number 
   messages:string[]

}

const conversationSchema = new mongoose.Schema({
   users:{type:[String],required:true},
   name:{type:String, required:true},
   created:{default:Date.now(), type:Number},
   messages:[{type:mongoose.Schema.Types.ObjectId, ref:"Message"}],
   conversationPic:{
    url:{type:String},
    publicId:{type:String}
   }
})

const conversationSchemas = {
   createConversationSchema : Joi.object({
      users:Joi.array().min(1).required(),
      name:Joi.string().required()
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

conversationSchema.pre<ConversationInterface>("deleteOne",async function(next){
   try{
      Message.deleteMany({conversationId:this._id})
      this.users.map(async(user) => {
         const _user = await  User.findById(user)
         if(_user){
            const filteredConversations = _user.conversations.filter(conversation => conversation.conversationId !== this._id)
            _user.set({
               conversations:filteredConversations
            })
            await _user.save()
         }
      });
      next()
   }
   catch (error){
     console.log(error)
     next()
   }
})



const Conversation = mongoose.model("Conversation",conversationSchema)


export {conversationSchemas}
export default Conversation





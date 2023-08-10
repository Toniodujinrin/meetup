import Joi from "joi";
import mongoose from "mongoose";
import Message from "./message";
import User from "./users";


interface ConversationInterface extends mongoose.Document{
  
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





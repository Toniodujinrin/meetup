import mongoose from "mongoose";


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

const Conversation = mongoose.model("Conversation",conversationSchema)



export default Conversation





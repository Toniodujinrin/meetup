import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    timeStamp:{default:Date.now(), required:true }, 
    status:{type:String, enum:["read","delivered"]},
    conversionId:{type:String, require:true},
    body:String 
})

const Message = mongoose.model("Message",messageSchema)

export default Message
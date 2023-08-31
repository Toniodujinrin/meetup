import mongoose from "mongoose";


const otpSchema = new mongoose.Schema({
 _id:{type:String, required:true, minLength:5, maxLength:5},
 timestamp:{type:Number, default:Date.now},
 email:{type:String, required:true}
})


const OTP = mongoose.model("OTP", otpSchema)
export default OTP
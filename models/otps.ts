import mongoose from "mongoose";


const otpSchema = new mongoose.Schema({
 _id:{type:String, required:true, minLength:5, maxLength:5},
 expiry:{type:Number, default:Date.now()+(1000*60*5)},
 email:{type:String, required:true}
})


const OTP = mongoose.model("OTP", otpSchema)
export default OTP
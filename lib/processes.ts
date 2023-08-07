import Message from "../models/message"
import OTP from "../models/otps"
class Processes{
    static envChecker = ()=>{
        if( process.env.PORT && process.env.MONGO_URI && process.env.KEY, process.env.EMAIL_SERVER, process.env.HASHING_SECRET) return
        else{
            console.log("\x1b[31m%s\x1b[0m","Error: missing environmental properties, exiting ...")
            process.exit(1)
        }
    }

    static otpProcess = async  ()=>{
        console.log("\x1b[33m%s\x1b[0m","OTP process started ...")
        setInterval(async()=>{
            await OTP.deleteMany({expiry:{$lt:Date.now()}})
        },10000)
    }

    static messageProcess = async ()=>{
        console.log("\x1b[33m%s\x1b[0m","OTP process started ...")
        setInterval(async ()=>{
            await Message.deleteMany({expiry:{$lt:Date.now()}})
        },10000)
    } 

}


export default Processes
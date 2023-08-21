import Message from "../models/message"
import OTP from "../models/otps"
class Processes{
    static envChecker = ()=>{
        console.log("\x1b[33m%s\x1b[0m","[+] Checking environment variables ...")
        const envVariables = [
            process.env.PORT , process.env.MONGO_URI , process.env.KEY, process.env.EMAIL_SERVER, process.env.HASHING_SECRET,process.env.CLOUDINARY_NAME,process.env.CLOUDINARY_API_KEY,process.env.CLOUDINARY_API_SECRET,
            process.env.HTTPS,process.env.SERVER_CERT,process.env.SERVER_KEY, process.env.CLOUDINARY_URL
        ]
        for(let i of envVariables){
            if(!i){
                console.log("\x1b[31m%s\x1b[0m","[x] Error: missing environmental properties, exiting ...")
                process.exit(1)
            }
        }
        console.log("\x1b[32m%s\x1b[0m","[o] All environment variables available ...")
    }

    static otpProcess = async  ()=>{
        console.log("\x1b[33m%s\x1b[0m","[+] OTP process started ...")
        setInterval(async()=>{
            await OTP.deleteMany({expiry:{$lt:Date.now()}})
        },10000)
    }

    static messageProcess = async ()=>{
        console.log("\x1b[33m%s\x1b[0m","[+] Message process started ...")
        setInterval(async ()=>{
            await Message.deleteMany({expiry:{$lt:Date.now()}})
        },10000)
    } 

}


export default Processes
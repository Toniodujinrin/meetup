import Message from "../models/message"
import Conversation from "../models/conversations"
import OTP from "../models/otps"
import { ObjectId } from "mongodb"
import { Schema } from "mongoose"
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

    static otpProcess = ()=>{
        console.log("\x1b[33m%s\x1b[0m","[+] OTP process started ...")
        setInterval(async()=>{
            await OTP.deleteMany({expiry:{$lt:Date.now()}})
        },10000)
    }

    static messageProcess = ()=>{
        console.log("\x1b[33m%s\x1b[0m","[+] Message process started ...")
        setInterval(async ()=>{
            await Message.deleteMany({expiry:{$lt:Date.now()}})
        },10000)
    }

    
    static conversationProcess = ()=>{
        console.log("\x1b[33m%s\x1b[0m","[+] Conversation process started ...")
        setInterval( async ()=>{
       
        
        const conversations = await Conversation.find({"messages.0":{$exists:true}})
        if(conversations){
            const conversationProcess = conversations.map(async conversation =>{
                const obsoleteMessages:Schema.Types.ObjectId[] = []
                const findObsoleteMessagesProcess = conversation.messages.map(async message => {
                    if(!await Message.findById(message)){
                        obsoleteMessages.push(message)
                    }
                })
                await Promise.all(findObsoleteMessagesProcess)
                const filteredConversationMessages = conversation.messages.filter(message => !obsoleteMessages.includes(message))
                await Conversation.updateOne({_id:conversation._id},{$set:{messages:filteredConversationMessages}})
            })
            await Promise.all(conversationProcess)
        }
      },(1000*60*5))
     
    }

}


export default Processes
import crypto from "crypto"
import axios from "axios"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongoose"
import { MessageInterface } from "./types"
import Conversation from "../models/conversations"
import User from "../models/users"
import { populate } from "dotenv"
import mongoose from "mongoose"


class Helpers{
    static passwordHasher =(str:string)=>{
        const secret = process.env.HASHING_SECRET
        if(typeof secret== "string"){
         let hash = crypto.createHmac("sha256",secret).update(str).digest("hex")
         return hash
        }
        else{
            throw new Error("hashing secret not found")
        }
    }

    static OTPSender = async  (email:string,length:number) =>{
        const acceptedchars = "1234567890"
        let result = "";
        for (let i = 0; i <length; i++){
            result += acceptedchars[Math.floor(Math.random()*acceptedchars.length)]
        }
        const payload ={
            receiver:email,
            subject:"OTP for Sign up",
            from:"Meet Up",
            text:`use this code as your one time password ${result}`
        }
        try {
            await axios.post(`${process.env.EMAIL_SERVER}/send`,payload)
           
            return result
        } catch (error) {
            console.log(error)
            return null
        }
        
    }
    static generateUserToken = (payload:any)=>{
      const key = process.env.KEY 
      if(typeof key == "string"){
        const token = `Bearer ${jwt.sign(payload, key)}`
        return token
      }
      else throw new Error("could not generate token")
    }

    static checkIfSubset = (arr1:string[], arr2:string[])=>{
       let isSubset = true
       for(let item of arr2){
        if(!arr1.includes(item)){
            isSubset = false 
            break
        }
        }

        return isSubset
    }

    static normalizeConversation = async (conversationId:string, userId:string)=>{
        const  conversation = await Conversation.findById(conversationId).populate<{messages:MessageInterface[]}>("messages")
        let _conversation:{name?:string, conversationPic?:{url:string, public_id:string}|{}, lastMessage?:MessageInterface, _id?:string, users?:string[], type?:string} = {}
        if (!conversation) return null
        if(conversation.type == "single"){
            const otherUser = conversation.users.filter((user:string)=> user != userId)[0]
            const otherUserObject  = await User.findById(otherUser)
            if(!otherUserObject) return null
            _conversation.name = otherUserObject.username
            _conversation.conversationPic = otherUserObject.profilePic? otherUserObject.profilePic: {}
        }
        else{
            _conversation.conversationPic = {}
        }
        _conversation.type = conversation.type
        _conversation._id = conversation._id
        _conversation.users = conversation.users
        _conversation.lastMessage = conversation.messages.length > 0 ? conversation.messages[conversation.messages.length -1]:undefined
        return _conversation
    }


    static getNormalizedNotifications  = async(userId:string)=>{
        const user = await User.findById(userId)
        if(user){
           let normalizedNotifcations = user.notifications.map(async (notification:any) => {
             notification.conversationDetails = await this.normalizeConversation(notification.conversationId,userId)
             return notification
           })
           normalizedNotifcations = await Promise.all(normalizedNotifcations)
           return normalizedNotifcations
        }
    }

   
}







export default Helpers
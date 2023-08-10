import { Socket, Server } from "socket.io"
import User from "../models/users"
import Conversation from "../models/conversations"
import Message from "../models/message"
import _ from "lodash"

class SocketLib{
    static getAllSockets = async(io:Server , room:string)=>{
        const clients = await io.in(room).fetchSockets()
        const ids = clients.map((client:any) =>{return client.user})
        return ids
    }
    
    static leaveAllRooms = (socket:Socket, io:Server)=>{
        const rooms = Object.keys(socket.rooms)
        const roomToLeave = rooms.filter(room => room!== socket.id && room !== undefined)
        roomToLeave.forEach(async (room) =>{
            socket.leave(room)
            const ids = await this.getAllSockets(io,room)
            io.to(room).emit("online",ids)
        })
    }

    static sendMessage = async (io:Server,body:string,conversationId:string )=>{
        let message =  new Message({
            conversationId,
            body:body
         })
         message = await message.save()
         io.to(conversationId).emit("new_message",message)
    }

    static updateLastSeen = async(email:string|undefined)=>{
        User.findByIdAndUpdate(email,{
            $set:{lastSeen:Date.now()}
        })
    }

    static getUserGroupKey = async (email:string|undefined,conversationId:string)=>{
        const user = await User.findById(email)
        if(user && user.conversations){
           const conversation = user.conversationKeys.find(conversation => conversation.conversationId == conversationId)
           if(!conversation) throw new Error("unauthorized user")
           return conversation.groupKey
        }
        throw new Error("invalid user")
    }

    static getPreviousMessages = async (conversationId:string|undefined)=>{
        let previousMessages = await Conversation.findById(conversationId).populate("messages").select({messages:1})
        if(previousMessages) return previousMessages.messages 
    }
}

export default SocketLib
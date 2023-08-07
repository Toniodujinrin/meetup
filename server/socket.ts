import { Server, Socket } from "socket.io"
import authorization from "../middleware/socketAuthentication"
import SocketLib from "../lib/socket"
import Conversation from "../models/conversations"
import Message from "../models/message"

interface SocketInterface extends Socket{
   user?:string
}

const socketHandler = (io:Server)=>{
    io.use(authorization)
    
   
    io.on("connection",(socket: SocketInterface)=>{
        console.log("user connected")
       
        
        socket.on("join",async ({conversationId})=>{
            try {
                const groupKey = SocketLib.getUserGroupKey(socket.user,conversationId)
                socket.emit("groupKey",groupKey)
                socket.join(conversationId)
                const previousMessages = await SocketLib.getPreviousMessages(conversationId)
                socket.emit("previousMessages",previousMessages)
                const onlineUsers = SocketLib.getAllSockets(io, conversationId)
                socket.emit("onlineUsers",onlineUsers)
            } catch (error) {
                socket.emit("connect_error",error)
            } 
        })

       socket.on("message",async ({text,conversationId})=>{
            let message =  new Message({
               conversationId,
               body:{
                 text,
                 senderId:socket.user
               }
            })
            message = await message.save()
            io.to(conversationId).emit("message",message)
        })
        socket.on("disconnect",async()=>{
            
                SocketLib.leaveAllRooms(socket, io)
                SocketLib.updateLastSeen(socket.user)
           
          
        })
        
    })

 
    
}

export default  socketHandler
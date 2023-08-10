import { Server, Socket } from "socket.io"
import authorization from "../middleware/socketAuthentication"
import SocketLib from "../lib/socket"


interface SocketInterface extends Socket{
   user?:string
}

const socketHandler = (io:Server)=>{
    io.use(authorization)
    
   
    io.on("connection",(socket: SocketInterface)=>{
        console.log("user connected")
       
        
        socket.on("join",async ({conversationId})=>{
            try {
                const groupKey = await SocketLib.getUserGroupKey(socket.user,conversationId)
                socket.emit("groupKey",groupKey)
                socket.join(conversationId)
                const previousMessages = await SocketLib.getPreviousMessages(conversationId)
                socket.emit("previousMessages",previousMessages)
                const onlineUsers = await SocketLib.getAllSockets(io, conversationId)
                socket.emit("onlineUsers",onlineUsers)
            } catch (error) {
                console.log(error)
                socket.emit("conn_error",error)
            } 
        })

       socket.on("message",async ({body,conversationId})=>{
        try {
            await SocketLib.sendMessage(io,body,conversationId)
        } catch (error) {
            socket.emit("conn_error",error)
        }
        })
        socket.on("disconnect",async()=>{
            try {
                SocketLib.leaveAllRooms(socket, io)
                await SocketLib.updateLastSeen(socket.user)
            } catch (error) {
                socket.emit("conn_error",error)
            }
          
        })
        
    })

 
    
}

export default  socketHandler
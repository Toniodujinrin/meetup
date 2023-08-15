import { Server, Socket } from "socket.io"
import authorization from "../middleware/socketAuthentication"
import SocketLib from "../lib/socket"
import { disconnect } from "process"
import { SocketInterface } from "../lib/types"



const socketHandler = (io:Server)=>{
    io.use(authorization)
    
   
    io.on("connection",async(socket: SocketInterface)=>{
        console.log("user connected", socket.user)
        const onlineContacts = await SocketLib.getAllOnlineContacts(socket.user,io)
        socket.emit("onlineContacts",onlineContacts)
        
        socket.on("join",async ({conversationId})=>{
            try {
                const groupKey = await SocketLib.getUserGroupKey(socket.user,conversationId)
                socket.emit("groupKey",groupKey)
                socket.join(conversationId)
                const previousMessages = await SocketLib.getPreviousMessages(conversationId)
                socket.emit("previousMessages",previousMessages)
                const onlineUsers = await SocketLib.getAllSocketsInRoom(io, conversationId)
                io.to(conversationId).emit("onlineUsers",onlineUsers)
            } catch (error) {
                console.log(error)
                socket.emit("conn_error",error)
            } 
        })

        socket.on("leaveRoom", async ({conversationId})=>{
          try {
            await SocketLib.leaveRoom(socket,io,conversationId)
          } catch (error) {
            socket.emit("conn_error",error)
          }
        })

       socket.on("message",async ({body,conversationId})=>{
        try {
            await SocketLib.sendMessage(io,body,conversationId, socket.user)
        } catch (error) {
            socket.emit("conn_error",error)
        }
        })

        socket.on("disconnecting", async ()=>{
            try {
                
                await SocketLib.leaveAllRooms(socket, io)
                await SocketLib.updateLastSeen(socket.user)
            } catch (error) {
                socket.emit("conn_error",error)
            }
        })
       
        
    })

 
    
}

export default  socketHandler
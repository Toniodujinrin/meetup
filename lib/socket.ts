import { Socket, Server } from "socket.io"
import User from "../models/users"
import Conversation from "../models/conversations"
import Message from "../models/message"
import _ from "lodash"
import { MessageInterface, MessageInterfacePopulated } from "./types"


class SocketLib{
    static getAllSocketsInRoom = async(io:Server , room:string)=>{
        const clients = await io.in(room).fetchSockets()
        const ids = clients.map((client:any) =>{return client.user})
        return ids
    }

    static getAllSocketsInRoomWithIds = async(io:Server , room:string)=>{
        const clients = await io.in(room).fetchSockets()
        const ids = clients.map((client:any) =>{return {userId:client.user, socketId:client.id}})
        return ids
    }

    
    static leaveAllRooms = async (socket:any, io:Server)=>{
        for  (let room of socket.rooms){
            if(room !== socket.id){
                let  ids = await this.getAllSocketsInRoom(io,room)
                ids = ids.filter(id => id !== socket.user)
                io.to(room).emit("onlineUsers",ids)
            }
        }
    }

    static leaveRoom = async(socket:Socket, io:Server, conversationId:string)=>{
       await socket.leave(conversationId)
       const ids = await this.getAllSocketsInRoom(io,conversationId)
       io.to(conversationId).emit("onlineUsers",ids)
    }


    static getAllSockets = async (io:Server)=>{
        const client = await io.fetchSockets()
        const ids = client.map((client:any)=> {return client.user})
        return ids
    }

    static getSocketIdFromUserId = async (io:Server, userId:string)=>{
        const client = await io.fetchSockets()
        let socketId
        client.map((client:any)=> { if (client.user ==userId )socketId = client.id })
        return socketId
    }
    
    //room for optimization
    static getAllOnlineContacts = async (userId:string|undefined, io:Server)=>{
        const user = await User.findById(userId)
        const onlineContacts = []
        if(user){
            const contacts = user.contacts
            const onlineUsers = await this.getAllSockets(io)
            for(let contact of contacts){
                if(onlineUsers.includes(contact)){
                    onlineContacts.push(contact)
                }
            }
        }
        return onlineContacts
    }

    static sendMessage = async (io:Server,body:string,conversationId:string,senderId:string|undefined  )=>{
        const conversation = await Conversation.findById(conversationId)
        if(!conversation) throw new Error("conversation not found")
        
        let message =  new Message({
            conversationId,
            body,
            senderId
        })
        message = await message.save()
        const msg = await Message.findById(message._id).populate({path:"senderId", select:"_id username profilePic"})
        io.to(conversationId).emit("new_message",msg)

        // send notification to all offline users


        const onlineSockets = await this.getAllSocketsInRoom(io,conversationId)
        const users = conversation.users
        const proc = users.map( async userId=>{
            if (!onlineSockets.includes(userId)){
                const user = await User.findById(userId)
                if(!user) throw new Error("user not found")
                if(!user.notifications) user.notifications = []
                const notificationExists = user.notifications.find(notification => notification.conversationId == conversationId)
                if (notificationExists){
                    user.notifications.map(notification =>{
                        if (notification.conversationId == conversationId && notification.amount){
                            notification.amount += 1 
                            notification.timeStamp = Date.now()
                        }
                    })
                }
                else user.notifications.unshift({conversationId, amount:1, timeStamp:Date.now()})
                user.notifications.sort((n1,n2)=> (n1.timeStamp && n2.timeStamp)?  n2.timeStamp - n1.timeStamp:0 )
                await user.updateOne({$set:{
                    notifications:user.notifications
                }})
                const socketId = await this.getSocketIdFromUserId(io,userId)
                if(socketId) io.to(socketId).emit("new_notification",user.notifications)
            }
        }
        )
        await Promise.all(proc)
    }

    static updateLastSeen = async(email:string|undefined)=>{
        await User.findByIdAndUpdate(email,{
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

    static getPreviousMessages = async (conversationId:string|undefined, socket:any )=>{
        let previousMessages = await Conversation.findById(conversationId).populate<{messages:MessageInterface[]}>("messages")
        if(previousMessages){
            const messages = previousMessages.messages
            if(messages.length > 0){
                const lastMessage = messages[messages.length -1]
                if(lastMessage.senderId !== socket.user ){
                    const proc = messages.map(async message =>{
                        if(message.status !== "read"){
                        await Message.findByIdAndUpdate(message._id,{
                            $set:{status:"read"}
                        })
                       }
                    })
                    await Promise.all(proc)
                }
            }
            const updatedPreviousMessages = await Conversation.findById(conversationId).populate<{messages:MessageInterfacePopulated[]}>({path:"messages",populate:{path:"senderId",select:"_id username profilePic"}})
            return updatedPreviousMessages?.messages 
        } 
    }


    static clearNotifications = async(conversationId:string, socket:any)=>{
        const user = await User.findById(socket.user)
        if(!user) throw new Error("user not found")
        const notifications = user.notifications.filter(notification => notification.conversationId !== conversationId)
        await user.updateOne({$set:{notifications}})
        socket.emit("notification",notifications)
    }


  
}

export default SocketLib
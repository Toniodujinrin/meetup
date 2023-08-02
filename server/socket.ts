import { Server } from "socket.io"

const socketHandler = (io:Server)=>{

    io.on("connection",(socket)=>{
        console.log("user connected")
      })
      const adminSpace = io.of("/admin")
      adminSpace.on("connection", (socket)=>{
        console.log("user connected")
        
        socket.on("test",(args)=>{
          console.log(args)
        })
        socket.on("disconnect", ()=>{
          console.log("user disconnected")
        })
    })



}

export default  socketHandler
import express from "express"
import http from "http"
import https from "https"
import startup from "./server/startup"
import conncectToDatabase from "./lib/mongoconnect"
import Processes from "./lib/processes"
import {Server} from "socket.io"
import socketHandler from "./server/socket"




require("dotenv").config()
Processes.envChecker()

conncectToDatabase()
// Processes.otpProcess()
Processes.messageProcess()
Processes.conversationProcess()
const app = express()
startup(app)


const server = http.createServer(app)
const httpsServer = https.createServer({
  key:process.env.SERVER_KEY,
  cert:process.env.SERVER_CERT,
  ca:process.env.CA,


},app)

const io = new Server(httpsServer,{
  cors:{
    
    origin:["https://meet-up-client.vercel.app", "http://localhost:3000"],
    methods:["GET","POST"],
    credentials: true,
  },
  
})



socketHandler(io)


httpsServer.listen(process.env.HTTPS,()=>{
  console.log("\x1b[32m%s\x1b[0m",`[o] https server listening on port ${process.env.HTTPS}`)
})

server.listen(process.env.PORT,()=>{
  console.log("\x1b[32m%s\x1b[0m",`[o] http server listening on port ${process.env.PORT}`)
})

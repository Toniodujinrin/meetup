import express from "express"
import http from "http"
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

const app = express()
startup(app)


const server = http.createServer(app)

const io = new Server(server,{
  cors:{
    origin:`*`,
    credentials: true
  }
})

socketHandler(io)



server.listen(process.env.PORT,()=>{
  console.log("\x1b[32m%s\x1b[0m",`[o] server listening on port ${process.env.PORT}`)
})

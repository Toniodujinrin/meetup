import express from "express"
import http from "http"
import startup from "./server/startup"
import conncectToDatabase from "./lib/mongoconnect"
import Processes from "./lib/processes"



require("dotenv").config()
Processes.envChecker()
conncectToDatabase()



const app = express()
startup(app)






http.createServer(app)
.listen(process.env.PORT,()=>{
  console.log(`server listening on port ${process.env.PORT}`)
})

import express from "express"
import http from "http"
import startup from "./startup"
import conncectToDatabase from "../mongo/mongoconnect"

require("dotenv").config()
conncectToDatabase()

const app = express()
startup(app)






 http.createServer(app)
.listen(process.env.PORT,()=>{
  console.log(`server listening on port ${process.env.PORT}`)
})

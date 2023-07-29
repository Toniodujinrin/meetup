import express from "express"
import http from "http"
import conncectToDatabase from "./mongo/mongoconnect"
import "./models/users"
import "./lib/encryption"
// import "./models/keys"
require("dotenv").config()
conncectToDatabase()

const app = express()
app.use(express.json())




http.createServer(app)
.listen(process.env.PORT,()=>{
  console.log(`server listening on port ${process.env.PORT}`)
})

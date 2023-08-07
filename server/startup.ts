import express,{Express}  from "express"
import users from "../routes/users"
import auth from "../routes/auth"
import conversations from "../routes/conversations"
import cors from "cors"


const startup = (app:Express)=>{
    app.use(express.static("public"))
    app.use(cors())
    app.use(express.json())
    app.use("/api/users",users)
    app.use("/api/auth", auth)
    app.use("/api/conversations",conversations)
}

export default startup
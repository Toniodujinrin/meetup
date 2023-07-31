import express,{Express}  from "express"
import users from "../routes/users"
import auth from "../routes/auth"
import cors from "cors"

const startup = (app:Express)=>{
    app.use(cors())
    app.use(express.json())
    app.use("/api/users",users)
    app.use("/api/auth", auth)
    
    
}

export default startup
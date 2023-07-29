import express,{Express}  from "express"
import users from "../routes/users"

const startup = (app:Express)=>{
   
    app.use(express.json())
    app.use("/api/users",users)
}

export default startup
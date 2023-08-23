import jwt from "jsonwebtoken"
import User from "../models/users";
import { ExtendedError } from "socket.io/dist/namespace";



const authorization = async (socket:any,next:(err?: ExtendedError | undefined) => void)=>{
    console.log(socket)
    let token = socket.handshake.auth.token 
    const key = process.env.KEY
    if(token && typeof key =="string"){
      try{
        token = token.replace("Bearer","").trim()
        const payload:any = jwt.verify(token,key)
        const user = await User.findById(payload._id)
        if(user && user.isVerified){
            socket.user = user._id
            next()
        }
        else return socket.emit("conn_error",new Error("not authorized"))
      }
      catch(err){
       
        socket.emit("conn_error",new Error("server error"))
      }
    }
    else  socket.emit("conn_error",new Error("invalid token"))
}

export default authorization
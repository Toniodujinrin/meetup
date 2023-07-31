import { StatusCodes } from "http-status-codes";
import emiters from "../lib/emiters";
import User, {userSchemas} from "../models/users";
import jwt from "jsonwebtoken"
import Helpers from "../lib/helpers";
const {authenticationEmiter} = emiters
const {createUserSchema} = userSchemas



authenticationEmiter.on("authenticate", async (args)=>{
    const {body, res}= args[0]
    const {error} = createUserSchema.validate(body)
    if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
    const {email, password} = body
    const user = await User.findById(email)
    if(user){
        const hashedPassword = Helpers.passwordHasher(password)
        if(hashedPassword == user.password){
            const payload = {
                _id: user._id,
                isVerified:user.isVerified,
                emailVerified:user.emailVerified,
                accountVerified:user.accountVerified
            }
            const key = process.env.KEY
            if(typeof key == "string" ){
            const token =`Bearer ${jwt.sign(payload,key)}`
            res.header("Authotization",token)
            return res.status(StatusCodes.OK).json({status:"succes"})
            }
        }
        else res.status(StatusCodes.BAD_REQUEST).send("Invalid username or password")
    }
    else res.send(StatusCodes.BAD_REQUEST).send("Invalid username or password")
    
})
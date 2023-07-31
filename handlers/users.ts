import emiter from "../lib/emiters";
import User,{userSchemas} from "../models/users";
import OTP from "../models/otps";
import { StatusCodes } from "http-status-codes";
import Helpers from "../lib/helpers"
const {userEmiter }= emiter
const {createUserSchema, verifyAccountSchema, verifyEmailSchema, getUserSchema} = userSchemas

userEmiter.on("get user",(args)=>{
    const {email,res} = args[0]
    const {error} = getUserSchema.validate(email)
    if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
    res.send(email)
})

userEmiter.on("create user", async (args)=>{
    const{body,res} = args[0]
    try{
    const {error} = createUserSchema.validate(body)
    if(error){
        res.status(StatusCodes.BAD_REQUEST).send(error.message)
        return 
    }
    else{
        const {email,password}= body
        let user = await User.findById(email)
        if(user) return res.status(StatusCodes.BAD_REQUEST).send("user already exists")
        const hashedPassword = Helpers.passwordHasher(password)
        user = new User({
            _id:email,
            password:hashedPassword
        })
        await user.save()
        const otp = await Helpers.OTPSender(email,5)
        if(otp){
            const otpObject = new OTP({
                _id:otp,
                email
            })
            await otpObject.save()
        }
        res.status(StatusCodes.CREATED).send("user profile created")
    }
   }
   catch (err){
      console.log(err)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error ")
   }
})



userEmiter.on("verify account", async (args)=>{
    const {body,res} = args[0]
    try {
        const {error} = verifyAccountSchema.validate(body)
    } catch (error) {
        
    }
})

userEmiter.on("verify email", async(args)=>{
   const {body, res}= args[0]
})










import emiter from "../lib/emiters";
import User,{userSchemas} from "../models/users";
import OTP from "../models/otps";
import Encryption from "../lib/encryption";
import { StatusCodes } from "http-status-codes";
import Helpers from "../lib/helpers"
const {userEmiter }= emiter
const encryption = new Encryption()
const {createUserSchema, verifyAccountSchema, verifyEmailSchema, getUserSchema} = userSchemas

userEmiter.on("get user",async (args)=>{
    const {params,res} = args[0]
    const {error} = getUserSchema.validate(params)
    if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
    const {email} = params 
    const user = await User.findOne({_id:email, isVerified:true}).select({username:1, firstName:1, lastName:1, lastSeen:1 , resgistration:1 , phone:1, conversations:1 })
    if(user)res.status(StatusCodes.OK).json(user)
    else res.status(StatusCodes.NOT_FOUND).send("user not found")
})

userEmiter.on("create user", async (args)=>{
    const{req,res} = args[0]
    try{
    const {error} = createUserSchema.validate(req.body)
    if(error){
        res.status(StatusCodes.BAD_REQUEST).send(error.message)
        return 
    }
    else{
        const {email,password}= req.body
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
        const payload = {
            _id : user._id, 
            emailVerified: user.emailVerified, 
            accountVerified: user.accountVerified, 
            isVerified: user.isVerified
        }
        const token = Helpers.generateUserToken(payload)
        res.header("authorization", token).status(StatusCodes.CREATED).json({status:"success"})
    }
   }
   catch (err){
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
   }
})



userEmiter.on("verify account", async (args)=>{
    const {req,res} = args[0]
    if(!req.emailVerified) return res.status(StatusCodes.UNAUTHORIZED).send("email not verified")
    try {
        const {error} = verifyAccountSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        else{
            const {username, firstName, lastName, phone} = req.body
            const keyPair = await encryption.generateKeyPair()
            const publicKey = keyPair.publicKey
            const encryptedKeyPair = await  encryption.encryptKeyPair(keyPair)
            const user = await User.findByIdAndUpdate(req.user,{
                $set :{
                   isVerified:true,
                   accountVerified:true,
                   username,
                   firstName,
                   lastName,
                   phone,
                   publicKey,
                   keyPair:encryptedKeyPair
                }
            }, {new:true}).select({accountVerified:1 , emailVerified:1, isVerified:1})
            if(user){
                const token = Helpers.generateUserToken(user.toJSON())
                res.header("authorization",token).status(StatusCodes.OK).send({status:"success"})
            }
            else res.status(StatusCodes.NOT_FOUND).send("user not found")
        }
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

userEmiter.on("verify email", async(args)=>{
   const {req, res}= args[0]
   try{
   if (req.emailVerified) return res.status(StatusCodes.BAD_REQUEST).send("email already verified")
   const {error}= verifyEmailSchema.validate(req.body)
   if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
   else{
    const {otp}= req.body
    const otpInDatabase = await OTP.findById(otp)
    if(otpInDatabase && otpInDatabase.email == req.user && otpInDatabase.expiry <= Date.now()){
        const user = await User.findByIdAndUpdate(req.user,{
            $set:{
                emailVerified:true, 
            }
        },{new:true}).select({isVerified:1 , accountVerified:1, emailVerified:1})
        if(user){
            const token = Helpers.generateUserToken(user.toJSON())
            res.header("authorization",token).status(StatusCodes.OK).json({status:"success"})
        }
        else res.status(StatusCodes.NOT_FOUND).send("user not found")

        
    }
    else return res.status(StatusCodes.BAD_REQUEST).send("Incorrect code")
    }
    }
    catch{
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})


userEmiter.on("resend otp", async(args)=>{
    const {req, res} = args[0]
    try{
        if(req.emailVerified) return res.status(StatusCodes.BAD_REQUEST).send("email already verified")
        const otp = await  Helpers.OTPSender(req.user,5)
        if(otp){
            const otpObject = new OTP({
                _id:otp,
                email:req.user
                
            })
            otpObject.save()
            res.status(StatusCodes.OK).json({status:"success"})
        }
        else return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
    catch(err){
        res.status(StatusCodes.BAD_REQUEST).send("server error ")
    }

})










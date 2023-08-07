import emiter from "../lib/emiters";
import User,{userSchemas} from "../models/users";
import OTP from "../models/otps";
import Encryption from "../lib/encryption";
import { StatusCodes } from "http-status-codes";
import Helpers from "../lib/helpers"
import _ from "lodash"
const {userEmiter }= emiter
const encryption = new Encryption()
const {createUserSchema, verifyAccountSchema, verifyEmailSchema, getUserSchema, updateUserSchema} = userSchemas

userEmiter.on("get user",async ({params,res})=>{
    const {error} = getUserSchema.validate(params)
    if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
    const {email} = params 
    try{
        const user = await User.findOne({_id:email, isVerified:true}).select({username:1, firstName:1, lastName:1, lastSeen:1 , resgistration:1 , phone:1, boi:1})
        if(user)res.status(StatusCodes.OK).json(user)
        else res.status(StatusCodes.NOT_FOUND).send("user not found")
    }
    catch (error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

userEmiter.on("get self", async({req,res})=>{
    try {
     const user = await User.findById(req.user).select({username:1, firstName:1, lastName:1, lastSeen:1, registration:1,phone:1, bio:1  }) 
     res.status(StatusCodes.OK).json(user)
    }
    catch (error) {
     res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
   }
})

userEmiter.on("create user", async ({req,res})=>{
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



userEmiter.on("verify account", async ({req,res})=>{
    if(!req.emailVerified) return res.status(StatusCodes.UNAUTHORIZED).send("email not verified")
    try {
        const {error} = verifyAccountSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
            const {username, firstName, lastName, phone, bio} = req.body
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
                   bio, 
                   keyPair:encryptedKeyPair
                }
            }, {new:true}).select({accountVerified:1 , emailVerified:1, isVerified:1})
            if(user){
                const token = Helpers.generateUserToken(user.toJSON())
                res.header("authorization",token).status(StatusCodes.OK).send({status:"success"})
            }
            else res.status(StatusCodes.NOT_FOUND).send("user not found")
        
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

userEmiter.on("verify email", async({req, res})=>{
   try{
   if (req.emailVerified) return res.status(StatusCodes.BAD_REQUEST).send("email already verified")
   const {error}= verifyEmailSchema.validate(req.body)
   if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
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
    catch{
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})


userEmiter.on("resend otp", async({req, res} )=>{
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
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error ")
    }
})

userEmiter.on("get conversations", async({req,res})=>{
    try{
        const response = await User.findById(req.user).select({
           conversations:1 
        })
        if(response){
            const conversations = _.omit(response.toJSON(), ["_id"])
            res.status(StatusCodes.OK).json(conversations)
        }
    }
    catch (error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

userEmiter.on("add user", async({req, res})=>{
    try{
       const {error}= getUserSchema.validate(req.params)
       if(error)return res.status(StatusCodes.BAD_REQUEST).send(error.message)
       const {email}= req.params
       const user = await User.findById(email)
       const self = await User.findById(req.user)
       if(user && self){
        if (self.contacts.includes(email))return res.status(StatusCodes.BAD_REQUEST).send("user already a contact")
        await User.findByIdAndUpdate(req.user, {
            $push:{contacts:email}
        })
        res.status(StatusCodes.OK).send({status:"success"})
       }
       else return res.status(StatusCodes.NOT_FOUND).send("user not found")
    }
    catch (error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

userEmiter.on("get contacts", async({req, res})=>{
    try {
        const response  = await User.findById(req.user).select({
            contacts:1
        })
        const contacts = _.omit(response?.toJSON(),["_id"])
        res.status(StatusCodes.OK).send(contacts)
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

userEmiter.on("update user", async ({req,res})=>{
    try{
        const {error} =  updateUserSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        await User.findByIdAndUpdate(req.user,req.body)
        res.status(StatusCodes.OK).json({status:"success"})
    }
    catch (error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})










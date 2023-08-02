import { StatusCodes } from "http-status-codes";
import emiters from "../lib/emiters";
import User, {userSchemas} from "../models/users";
import lodash from "lodash"
import Encryption from "../lib/encryption";
import Helpers from "../lib/helpers";
const {authenticationEmiter} = emiters
const encryption = new Encryption()
const {createUserSchema} = userSchemas



authenticationEmiter.on("authenticate", async (args)=>{
    const {body, res}= args[0]
    try{
    const {error} = createUserSchema.validate(body)
    if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
    const {email, password} = body
    const  user = await User.findById(email).select({
        isVerified:1, emailVerified:1, accountVerified:1, password:1, keyPair:1 
    })
    if(user){
        const hashedPassword = Helpers.passwordHasher(password)
        if(hashedPassword == user.password){
            const _user = lodash.omit(user.toJSON(), ["password"])
            if(user.keyPair){
               const decryptedKeyPair = await encryption.decryptKeyPair(user.keyPair) 
               _user.keyPair = decryptedKeyPair
            }
            const token = Helpers.generateUserToken(_user)
            res.header("authotization",token)
            return res.status(StatusCodes.OK).json({status:"success"})
            
        }
        else res.status(StatusCodes.BAD_REQUEST).send("Invalid username or password")
    }
    else res.status(StatusCodes.BAD_REQUEST).send("Invalid username or password")
   }
   catch(err){
    console.log(err)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
   }
})
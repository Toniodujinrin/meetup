import { StatusCodes } from "http-status-codes";
import emiters from "../lib/emiters";
import Conversation, {conversationSchemas} from "../models/conversations";
import Encryption from "../lib/encryption";
import User from "../models/users";
import Helpers from "../lib/helpers";
const {createConversationSchema, addUserSchema, deleteConversationSchema} = conversationSchemas
const {conversationEmiter} = emiters
const encryption = new Encryption()

conversationEmiter.on("create conversation", async ({req, res})=>{
    try{
        const {error} = createConversationSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const {users, name}= req.body
        const user = await User.findById(req.user).select({contacts:1})
        if(!user) return res.status(StatusCodes.NOT_FOUND).send("user not found")
        const contacts = user.contacts
        if(! Helpers.checkIfSubset(contacts, users) && !(users.length ==1 && users[0] == req.user)) return res.status(StatusCodes.BAD_REQUEST).send("all users must me be contacts")
        let conversation = new Conversation({
            users:users,
            name:name
        })
        conversation = await conversation.save()
        const conversationId = conversation._id
        const groupKey = encryption.createGroupKey()
        const process = users.map(async (user:string)=>{
            const usr = await User.findById(user).select({publicKey:1})
            if(usr && usr.publicKey){
                const encryptedGroupKey =  encryption.encryptGroupKey(usr.publicKey, groupKey)
                const conversationObject = {
                groupKey:encryptedGroupKey,
                conversationId
                }
                await usr.updateOne({
                $push:{conversations:conversationObject}
                }
                )
            }
            })
            await Promise.all(process)
            res.status(StatusCodes.OK).send({status:"success"})
        }
    
    catch(err){
        console.log(err)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})


conversationEmiter.on("add to conversation", async({req, res})=>{
    try{
        const {error} = addUserSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const {conversationId, users, groupKey}= req.body
        const conversation = await Conversation.findById(conversationId)
        if(!conversation)return res.status(StatusCodes.NOT_FOUND).send("conversation not found")
        if(Helpers.checkIfSubset(conversation.users,users))return res.status(StatusCodes.BAD_REQUEST).send("user already exists in conversation")
        const _user = await User.findById(req.user).select({contacts:1})
        if(!_user) return res.status(StatusCodes.NOT_FOUND).send("user not found")
        const contacts = _user.contacts
        if(!Helpers.checkIfSubset(contacts,users)) return res.status(StatusCodes.BAD_REQUEST).send("all users must be contacts")
        const process = users.map(async (user:string) =>{
            const usr = await User.findById(user)
            if(usr && usr.publicKey){
                const encryptedGroupKey = encryption.encryptGroupKey(usr.publicKey,groupKey) 
                const conversationObject = {
                    groupKey:encryptedGroupKey, 
                    conversationId
                }
                await usr.updateOne({
                    $push:{conversations:conversationObject}
                })
                await conversation.updateOne({
                    $push:{users:user}
                })
            }
        })
        await Promise.all(process)
        res.status(StatusCodes.OK).send({status:"success"})
    }
    catch(error){
        console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
}
)

conversationEmiter.on("delete",async ({req,res})=>{
    try{
        const {error} = deleteConversationSchema.validate(req.params)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const conversationId = req.params.conversationId 
        const conversation = await Conversation.findById(conversationId)
        if(!conversation) return res.status(StatusCodes.NOT_FOUND).send("conversation not found")
        if(!conversation.users.includes(req.user)) return res.status(StatusCodes.UNAUTHORIZED).send("you do not belong to this converation")
        await Conversation.deleteOne({_id:conversationId})
        res.status(StatusCodes.OK).json({status:"success"})
    }
    catch (error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})
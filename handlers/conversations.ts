import { StatusCodes } from "http-status-codes";
import emiters from "../lib/emiters";
import Conversation, {conversationSchemas} from "../models/conversations";
import { ReqResPair } from "../lib/types";
import Encryption from "../lib/encryption";
import User from "../models/users";
import { UserInterface } from "../lib/types";
import Helpers from "../lib/helpers";
import _ from "lodash";
const {createConversationSchema, addUserSchema, deleteConversationSchema} = conversationSchemas
const {conversationEmiter} = emiters
const encryption = new Encryption()



conversationEmiter.on("create conversation", async ({req, res}:ReqResPair)=>{
    try{
        const {error} = createConversationSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const {users, name, type}= req.body
        if(users.length >1 && type == "single") return res.status(StatusCodes.BAD_REQUEST).send("single conversations can only have 2 users")
        if(!Helpers.checkIfSubset(req.user.contacts, users)) return res.status(StatusCodes.BAD_REQUEST).send("all users must me be contacts") 
        users.push(req.userId)
        const conversationExists = await Conversation.find({users:{$all:users, $size:users.length}})
        if(conversationExists) return res.status(StatusCodes.BAD_REQUEST).send("conversation between users already exists")
        let conversation = new Conversation({
            users,
            name,
            type
        })
        conversation = await conversation.save()
        const conversationId = conversation._id
        const groupKey = encryption.createGroupKey()
        const process = users.map(async (user:string)=>{
            const usr = await User.findById(user).select({publicKey:1})
            if(usr && usr.publicKey){
                const encryptedGroupKey =  encryption.encryptGroupKey(usr.publicKey, groupKey)
                const conversationKeyObject = {
                groupKey:encryptedGroupKey,
                conversationId
                }
                await usr.updateOne({
                $push:{conversationKeys:conversationKeyObject, conversations:conversationId}
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


conversationEmiter.on("add to conversation", async({req, res}:ReqResPair)=>{
    try{
        const {error} = addUserSchema.validate(req.body)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const {conversationId, users, groupKey}= req.body
        const conversation = await Conversation.findById(conversationId)
        if(!conversation)return res.status(StatusCodes.NOT_FOUND).send("conversation not found")
        if(Helpers.checkIfSubset(conversation.users,users))return res.status(StatusCodes.BAD_REQUEST).send("user already exists in conversation")
        if(!Helpers.checkIfSubset(req.user.contacts,users)) return res.status(StatusCodes.BAD_REQUEST).send("all users must be contacts")
        const process = users.map(async (user:string) =>{
            const usr = await User.findById(user)
            if(usr && usr.publicKey){
                const encryptedGroupKey = encryption.encryptGroupKey(usr.publicKey,groupKey) 
                const conversationKeyObject = {
                    groupKey:encryptedGroupKey, 
                    conversationId
                }
                await usr.updateOne({
                    $push:{conversationKeys:conversationKeyObject,conversations:conversationId}
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

conversationEmiter.on("delete",async ({req,res}:ReqResPair)=>{
    try{
        const {error} = deleteConversationSchema.validate(req.params)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const conversationId = req.params.conversationId 
        const conversation = await Conversation.findById(conversationId)
        if(!conversation) return res.status(StatusCodes.NOT_FOUND).send("conversation not found")
        if(!conversation.users.includes(req.userId)) return res.status(StatusCodes.UNAUTHORIZED).send("you do not belong to this converation")
        await Conversation.findOneAndDelete({_id:conversationId})
        res.status(StatusCodes.OK).json({status:"success"})
    }
    catch (error){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})

conversationEmiter.on("get conversation", async ({req,res}:ReqResPair)=>{
    try {
        const {error} = deleteConversationSchema.validate(req.params)
        if(error) return res.status(StatusCodes.BAD_REQUEST).send(error.message)
        const conversationId = req.params.conversationId
        if(!req.user.conversations.includes(conversationId)) return res.status(StatusCodes.UNAUTHORIZED).send("you are not allowed to view this conversation")
        let conversation = await Conversation.findById(conversationId).populate<{users:UserInterface[]}>({path:"users", select:"username _id lastSeen"})
        if(!conversation) return res.status(StatusCodes.NOT_FOUND).send("conversation not found")
        let _conversation =  _.pick(conversation,["type","users","name","created","conversationPic","lastSeen"])
        if(_conversation.type == "single"){
            let  otherUser = _conversation.users.filter((user)=> user._id != req.userId)[0]
            _conversation.name = otherUser.username
            _conversation.lastSeen = otherUser.lastSeen
        }
        res.status(StatusCodes.OK).json(_conversation)
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
    }
})
import crypto from "crypto"
import fs from "fs"
import utils from "util"

const randomFillPromise = utils.promisify(crypto.randomFill)
const scryptPromise = utils.promisify(crypto.scrypt)
const generateKeyPairPromise = utils.promisify(crypto.generateKeyPair)



class Encryption{
    algorithm:string
    constructor(){
        this.algorithm = "aes-192-cbc"
    }

    chunkBuffer =(buffer:Buffer,size:number)=>{
                
        const chunks = []
        for (let i = 0; i< buffer.length; i+= size){
            chunks.push(buffer.subarray(i,i+size))
        }
        return chunks

    }
   
    generateKeyPair = async ()=>{
    const options = {
        modulusLength:4096, 
        publicKeyEncoding:{
            type:"spki", 
            format:"pem"
        },
        privateKeyEncoding:{
            type:"pkcs8",
            format:"pem"
        }
    }
    const keyPair = await generateKeyPairPromise("rsa",options)
    return keyPair
   }


  createGroupKeyAndVector=async ()=>{
    const iv = await randomFillPromise(new Uint8Array(16))
    const key = await scryptPromise("password", "salt",24) 
    const groupKeyAndVector  = {
        key:key,
        iv:iv
    }
   return JSON.stringify(groupKeyAndVector)
   }

   extractKeysandIv=(groupKey:string)=>{
    const groupKeyObject = JSON.parse(groupKey)
    const key=  Buffer.from(groupKeyObject.key.data)
    const iv = new Uint8Array(Object.values(groupKeyObject.iv))
    return({key:key,iv:iv})
   }

    encryptMessage= async (data:string, key:Buffer, iv:Uint8Array)=>{
    try {
    let encrypted = ""
    const cipher = crypto.createCipheriv(this.algorithm, key, iv)
    encrypted = cipher.update(data,"utf-8","base64")
    encrypted+= cipher.final("base64")
    if(encrypted) return encrypted
    }
    catch(error){
        console.log(error)
    }
    }

    decryptMessage = async (data:string,key:Buffer,iv:Uint8Array)=>{
        try {
            let decrypted = ""
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
            decrypted = decipher.update(data, "base64","utf8")
            decrypted += decipher.final("utf-8")
            if (decrypted) return decrypted
        } catch (error) {
             console.log(error)
        }
    }



    encryptGroupKey=(publicKey:string, groupKey:string)=>{
        const publicKeyBuffer = Buffer.from(publicKey,"base64")
        const groupKeyBuffer = Buffer.from(groupKey)
        try {
            const encryptedGroupKey = crypto.publicEncrypt(publicKeyBuffer,groupKeyBuffer)
            return encryptedGroupKey.toString("base64")
        } catch (error) {
            console.log("could not encrypt public key")
        }
    }
        
     
    decryptGroupKey = (privateKey:string,encryptedGroupKey:string)=>{
        const privateKeyBuffer = Buffer.from(privateKey,"base64")
        const encryptedGroupKeyBuffer = Buffer.from(encryptedGroupKey,"base64")
         try {
             const decryptedGroupKey = crypto.privateDecrypt(privateKeyBuffer,encryptedGroupKeyBuffer)
             return this.extractKeysandIv(decryptedGroupKey.toString("utf-8"))
         } catch (error) {
             console.log(error)
         }
    }

    sendMessage = async(message:string,groupKey:{key:Buffer, iv:Uint8Array})=>{
        const {key,iv}= groupKey
        const encryptedMessage = await this.encryptMessage(message,key,iv)
        return (encryptedMessage)
    }
    
    
    readMessage = async(encryptedMessage:string, groupKey:{key:Buffer, iv:Uint8Array})=>{
       const {key,iv}= groupKey
       const decrypted = await this.decryptMessage(encryptedMessage,key,iv)
       return (decrypted)
    }

    encryptKeyPair=(keyPair:{privateKey:crypto.KeyObject, publicKey:crypto.KeyObject})=>{
        const publicKey = process.env.MASTER_PUBLIC_KEY
        const stringedKeys = JSON.stringify(keyPair)
        if(typeof publicKey == "string"){
            const  keyPairBuffer = Buffer.from(stringedKeys)
            const chunks = this.chunkBuffer(keyPairBuffer,300)
            const encryptedChunks:Buffer[] = chunks.map(chunk=>{
            return crypto.publicEncrypt(publicKey,chunk)
            })
            return Buffer.concat(encryptedChunks).toString("base64")
        }
        else{
            throw new Error("No public key found in environment")
        }

    }
}

const test = async ()=>{
    const encryption = new Encryption()
    
    const keyPair = await encryption.generateKeyPair()
    console.log(encryption.encryptKeyPair(keyPair))

}

test()






export default  Encryption
module.exports  = Encryption










































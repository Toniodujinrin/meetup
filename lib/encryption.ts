import crypto from "crypto"

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
            chunks.push(new Uint8Array(buffer.subarray(i,i+size)))
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
      key,
      iv
    }
   return JSON.stringify(groupKeyAndVector)
   }

   extractKeysandIv=(groupKey:string)=>{
    const groupKeyObject = JSON.parse(groupKey)
    const key=  Buffer.from(groupKeyObject.key.data)
    const iv = new Uint8Array(Object.values(groupKeyObject.iv))
    return({key,iv})
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

    encryptKeyPair = async(keyPair:{privateKey:crypto.KeyObject, publicKey:crypto.KeyObject })=>{
        const groupKey = process.env.KEY
        if(typeof groupKey == "string"){
            const {key,iv} = this.extractKeysandIv(groupKey)
            const stringedKeyPair = JSON.stringify(keyPair)
            const encryptedKeyPair = await this.encryptMessage(stringedKeyPair,key,iv)
            return encryptedKeyPair
        }
        else{
            throw new Error("could not encrypt key pair")
        }
    }

    decryptKeyPair = async (encryptedKeyPair:string)=>{
        const groupKey = process.env.KEY
        if(typeof groupKey == "string"){
            const {key,iv}= this.extractKeysandIv(groupKey)
            const decryptedKeyPair = await this.decryptMessage(encryptedKeyPair,key,iv)
            if(decryptedKeyPair){
                const keyPair = JSON.parse(decryptedKeyPair)
                return keyPair
            }
            else{
                throw new Error("could not decrypt data")
            }
        }
        else{
            throw new Error("could not find decryption key")
        }

    }

}









export default  Encryption











































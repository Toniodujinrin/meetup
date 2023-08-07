import crypto from "crypto"
import NodeRSA from "node-rsa"

class Encryption{
    algorithm:string
    constructor(){
        this.algorithm = "aes-192-cbc"
    }

   
    generateKeyPair =  ()=>{
    const key = new NodeRSA({b:512})
    const publicKey = key.exportKey("pkcs1-public-pem").replace("\\n","")
    const privateKey = key.exportKey("pkcs1-private-pem").replace("\\n","")
    return {publicKey, privateKey}
    }


   createGroupKey= ()=>{
   return crypto.randomBytes(24).toString("base64")
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



    encryptGroupKey=(publicKey:any, groupKey:string)=>{
        let key = {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }
        const  encryptedGroupKey = crypto.publicEncrypt(key, Buffer.from(groupKey,"base64")).toString('base64')
        return encryptedGroupKey
    }
        
     
    decryptGroupKey = (privateKey:any,encryptedGroupKey:string)=>{
        let key = {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }
        const decryptedGroupKey = crypto.privateDecrypt(key, Buffer.from(encryptedGroupKey, 'base64')).toString("base64")
        return decryptedGroupKey
    }

    encryptKeyPair = async(keyPair:{privateKey:string, publicKey:string })=>{
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











































import mongoose from "mongoose";
import crypto, { KeyObject } from "crypto"
import Encryption from "../lib/encryption" 


const encryption = new Encryption()
const keySchema = new mongoose.Schema({
    privateKey:Object,
    prublicKey:Object
})

const Key = mongoose.model("Key",keySchema)
const createKey = async  ()=>{
    const {publicKey, privateKey} = await encryption.generateKeyPair()
  
    const key = new Key({
        privateKey:privateKey,
        prublicKey:publicKey

    })
    try {
         await key.save()
    } catch (error) {
        console.log(error)
        
    }
        

}

const getKey = async ()=>{
    const keys = await Key.findById("64c42dca8b9fb583ab531a23")
    console.log(typeof keys?.privateKey)
    
}
getKey()

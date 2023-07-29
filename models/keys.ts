import mongoose from "mongoose";
import Encryption from "../lib/encryption" 


const encryption = new Encryption()
const keySchema = new mongoose.Schema({
    _id : {type:String ,required:true},
    keys:{type:String , required:true }
})

const Key = mongoose.model("Key",keySchema)
const createKey = async  ()=>{
    const keyPair = await  encryption.generateKeyPair()
    const encrypedKeyPair = await encryption.encryptKeyPair(keyPair)
    const key = new Key({
        _id:"todujinrin@gmail.com",
        keys:encrypedKeyPair
    })
    try {


         await key.save()
         console.log("saved to database")
    } catch (error) {
        console.log(error)
        
    }
}
// createKey()

const getKey = async ()=>{
    const keys = await Key.findById("todujinrin@gmail.com").select({keys:1})
    if(keys){
    const keyPairs = await encryption.decryptKeyPair(keys.keys)
    console.log(keyPairs)
    }

}

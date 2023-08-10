import mongoose from "mongoose"

const connectToDatabase = async ()=>{
    
    try{
        if(process.env.MONGO_URI){
            await mongoose.connect(process.env.MONGO_URI)
            
            console.log("\x1b[32m%s\x1b[0m","[o] Connected to mongodb ...")
        }
        else console.log("no mongodb uri found")
    }
    catch(err){
        console.log(err)
    }  
}



export default connectToDatabase
import crypto from "crypto"
import axios from "axios"
import { error } from "console"


class Helpers{
    static passwordHasher =(str:string)=>{
        const secret = process.env.HASHING_SECRET
        if(typeof secret== "string"){
         let hash = crypto.createHmac("sha256",secret).update(str).digest("hex")
         return hash
        }
        else{
            throw new Error("hashing secret not found")
        }
    }

    static OTPSender = async  (email:string,length:number) =>{
        const acceptedchars = "1234567890"
        let result = "";
        for (let i = 0; i <length; i++){
            result += acceptedchars[Math.floor(Math.random()*acceptedchars.length)]
        }
        const payload ={
            receiver:email,
            subject:"OTP for Sign up",
            from:"Meet Up",
            text:`use this code as your one time password ${result}`
        }
        try {
            await axios.post(`${process.env.EMAIL_SERVER}/send`,payload)
           
            return result
        } catch (error) {
            console.log(error)
            return null
        }
        
    }
}


export default Helpers
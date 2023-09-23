import cloudinary from "cloudinary"

class ImageLib{

    constructor(){
        cloudinary.v2.config({
            cloud_name:process.env.CLOUDINARY_NAME, 
            api_key:process.env.CLOUDINARY_API_KEY, 
            api_secret:process.env.CLOUDINARY_API_SECRET,
            secure:true
        })
    }

    async uploadImage(image:string, folder:string){
        const {public_id, secure_url:url}  = await cloudinary.v2.uploader.upload(image, {folder:folder})
        return {public_id,url}
    }

    async deleteImage(public_id:string){
        await cloudinary.v2.uploader.destroy(public_id)
        
    }

    


}








export default ImageLib
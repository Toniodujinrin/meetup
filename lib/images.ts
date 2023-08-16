import cloudinary from "cloudinary"

cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUNDINARY_SECRET,
    secure:true
})


const uploadImage = async (image:string,folder:string)=>{
        cloudinary.v2.config({
            cloud_name:process.env.CLOUDINARY_NAME, 
            api_key:process.env.CLOUDINARY_API_KEY, 
            api_secret:process.env.CLOUDINARY_API_SECRET,
            secure:true
        })
        const {public_id, url}  = await cloudinary.v2.uploader.upload(image, {folder:folder})
        return {public_id,url}
}

const deleteImage = async (public_id:string)=>{
    cloudinary.v2.config({
        cloud_name:process.env.CLOUDINARY_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET,
        secure:true
    })
  
    await cloudinary.v2.uploader.destroy(public_id)
}





export {uploadImage, deleteImage}
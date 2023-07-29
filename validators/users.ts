import Joi from "joi";

const userSchemas = {
    createUserSchema : Joi.object({
        email:Joi.string().required().email({minDomainSegments:2}),
        password:Joi.string().required().min(3).max(30)
    }),

    verifyAccountSchema: Joi.object({
        username:Joi.string().required().min(2).max(15),
        firstName:Joi.string().required().min(2).max(15),
        lastName:Joi.string().required().min(2).max(15), 
        phone:Joi.string().required()

    }),

    verifyEmailSchema: Joi.object({
        otp:Joi.string().required().label("OTP")
    })

}

export default userSchemas
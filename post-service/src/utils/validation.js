const Joi = require("joi");

const validateCreatePost = (data)=>{
    const schema = Joi.object({
        content: Joi.string().min(20).max(500).required(),
        mediaIDs:Joi.array().required() 
    });
    return schema.validate(data);
}

module.exports = {validateCreatePost};
const Joi = require("joi");

function validateRegisteration(data) {
    const schema = Joi.object({
        username: Joi.string().min(3).max(10).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(5).max(10).required()
    });
    console.log(schema.validate(data));
    
    return schema.validate(data);
}

module.exports = { validateRegisteration };
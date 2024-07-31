const Joi = require('joi');

exports.registrationSchema = Joi.object({
    full_name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    mobile_number: Joi.string().length(11).required(),
    sporting: Joi.string().required(),
    password: Joi.string().min(6).required()
});

exports.passwordSchema = Joi.object({
    newPassword: Joi.string().min(6).required(),
    newPasswordConfirmed: Joi.string().min(6).required(),
});

exports.postSchema = Joi.object({
    caption: Joi.string().min(6).required(),
    price: Joi.number()
})
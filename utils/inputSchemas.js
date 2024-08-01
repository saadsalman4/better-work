const Joi = require('joi');

exports.registrationSchema = Joi.object({
    full_name: Joi.string().max(100).required().messages({
        'string.base': 'Full name should be a type of text.',
        'string.empty': 'Full name is required.',
        'string.max': 'Full name should not exceed 100 characters.',
        'any.required': 'Full name is required.',
    }),
    email: Joi.string().email().required().messages({
        'string.base': 'Email should be a type of text.',
        'string.email': 'Please enter a valid email address.',
        'string.empty': 'Email is required.',
        'any.required': 'Email is required.',
    }),
    mobile_number: Joi.string().length(11).required().messages({
        'string.base': 'Mobile number should be a type of text.',
        'string.length': 'Mobile number must be exactly 11 digits.',
        'string.empty': 'Mobile number is required.',
        'any.required': 'Mobile number is required.',
    }),
    sporting: Joi.string().required().messages({
        'string.base': 'Sporting should be a type of text.',
        'string.empty': 'Sporting field is required.',
        'any.required': 'Sporting field is required.',
    }),
    password: Joi.string().min(6).required().messages({
        'string.base': 'Password should be a type of text.',
        'string.min': 'Password must be at least 6 characters long.',
        'string.empty': 'Password is required.',
        'any.required': 'Password is required.',
    }),
});


exports.passwordSchema = Joi.object({
    newPassword: Joi.string().min(6).required().messages({
        'string.base': 'New password should be a type of text.',
        'string.min': 'New password must be at least 6 characters long.',
        'string.empty': 'New password is required.',
        'any.required': 'New password is required.',
    }),
    newPasswordConfirmed: Joi.string().min(6).required().messages({
        'string.base': 'Confirm new password should be a type of text.',
        'string.min': 'Confirm new password must be at least 6 characters long.',
        'string.empty': 'Confirm new password is required.',
        'any.required': 'Confirm new password is required.',
    }),
});


exports.postSchema = Joi.object({
    caption: Joi.string().min(6).required().messages({
        'string.base': 'Caption should be a type of text.',
        'string.min': 'Caption must be at least 6 characters long.',
        'string.empty': 'Caption is required.',
        'any.required': 'Caption is required.',
    }),
    price: Joi.number().optional().messages({
        'number.base': 'Price should be a type of number.',
    }),
});


exports.workoutSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.base': 'Title should be a type of text.',
        'string.empty': 'Title is required.',
        'any.required': 'Title is required.',
    }),
    description: Joi.string().optional().messages({
        'string.base': 'Description should be a type of text.',
    }),
    tag: Joi.string().required().messages({
        'string.base': 'Tag should be a type of text.',
        'string.empty': 'Tag is required.',
        'any.required': 'Tag is required.',
    }),
    price: Joi.number().optional().messages({
        'number.base': 'Price should be a type of number.',
    }),
    exercises: Joi.array().items(
        Joi.object({
            name: Joi.string().required().messages({
                'string.base': 'Exercise name should be a type of text.',
                'string.empty': 'Exercise name is required.',
                'any.required': 'Exercise name is required.',
            }),
            details: Joi.string().optional().allow(null, '').messages({
                'string.base': 'Details should be a type of text.',
            }),
        })
    ).min(1).required().messages({
        'array.base': 'Exercises should be an array.',
        'array.min': 'At least one exercise is required.',
        'any.required': 'Exercises are required.',
    }),
});

const bcrypt = require('bcryptjs');
const { sequelize, User, User_OTPS, User_OTPS, User_keys } = require('../connect');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const {generateOTP, sendOTP, resendOTP } = require("./athlete_auth.controller")

const passwordSchema = Joi.object({
    newPassword: Joi.string().min(6).required(),
    newPasswordConfirmed: Joi.string().min(6).required(),
});

async function forgotPassword (req, res){
    const {mobile_number} = req.body

    try{
        const user = await User.scope('withHash').findOne({ where: { mobile_number }})
        if(!user){
            return res.status(404).json({
                code: 404,
                message: "User not found",
            });
        }
        const otp = generateOTP()
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const newOTP = await User_OTPS.create({
            otp: otp,
            otp_expiry: expiresAt,
            user_mobile_number: user.mobile_number,
            otp_type: 'reset',
        })
        await sendOTP(user.mobile_number, otp)

        const payload = {
            mobile_number: user.mobile_number
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '10m'})

        //contiue from here


    }
    catch(e){

    }
}

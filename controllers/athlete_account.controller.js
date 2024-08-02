const bcrypt = require('bcryptjs');
const { sequelize, User, User_OTPS, User_keys } = require('../connect');
const jwt = require('jsonwebtoken');
const {generateOTP, sendOTP } = require("./athlete_auth.controller")
const { UserRole, OTPType, TokenType } = require('../utils/constants');
const {passwordSchema, editProfileSchema} = require('../utils/inputSchemas');
const path = require('path')
const fs = require('fs')



async function forgotPassword (req, res){
    const {mobile_number} = req.body

    try{
        const user = await User.findOne({ where: { mobile_number }})
        if(!user){
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            });
        }
        const otp = generateOTP()
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await User_OTPS.update(
            { is_active: false },
            {
              where: {
                user_slug: user.slug,
                otp_type: OTPType.RESET,
                is_active: true
              }
            }
          );

        const newOTP = await User_OTPS.create({
            otp: otp,
            otp_expiry: expiresAt,
            user_slug: user.slug,
            otp_type: OTPType.RESET,
        })
        await sendOTP(user.mobile_number, otp)

        return res.status(200).json({
            code: 200,
            message: "OTP sent successfully",
            data: []
        })
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function verifyOTP (req, res){
    const {mobile_number, otp} = req.body
    let transaction

    try{
        const user = await User.findOne({where: {mobile_number}})
        if(!user){
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            });
        }
        const now = new Date();

        const latestOTP = await User_OTPS.findOne({
            where: { user_slug: user.slug, otp_type: OTPType.RESET, is_active: true},
            order: [['createdAt', 'DESC']]
        });

        if (!latestOTP) {
            return res.status(404).json({
                code: 404,
                message: "OTP not found, please request OTP first",
                data: []
            });
        }

        const savedOTP = latestOTP.otp.toString().trim();
        const enteredOTP = otp.toString().trim();
    
        if (savedOTP !== enteredOTP || now > new Date(latestOTP.otp_expiry)) {
            return res.status(401).json({
                code: 401,
                message: "Incorrect OTP entered or OTP expired",
                data: []      
            });
        }
        const payload = {
            slug: user.slug
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '10m' });

        transaction = await sequelize.transaction();
    
        const currentKey = await User_keys.findOne({
            where: {
              user_slug: user.slug,
              tokenType: TokenType.ATHLETE_RESET,
              is_active: true},
              order: [['createdAt', 'DESC']],
        }, {transaction});

        if(currentKey){
            currentKey.is_active=false;
            await currentKey.save({transaction}); 
        }
    
        const newKey = User_keys.create({
            api_token: token,
            user_slug: user.slug,
            tokenType: TokenType.ATHLETE_RESET
        }, {transaction})

        await User_OTPS.update(
            { is_active: false }, // Set the fields to update
            {
              where: {
                user_slug: user.slug,
                otp_type: OTPType.RESET,
                is_active: true
              },
              transaction
            }
          );

        await transaction.commit();

        return res.status(200).json({
            code: 200,
            message: "OTP verified successfully",
            data: {
                slug: user.slug,
                full_name: user.full_name,
                email: user.email,
                mobile_number: user.mobile_number,
                token: token
            }
        });

    }
    catch(e){
        await transaction.rollback();
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function resetPassword(req, res){
    const {newPassword, newPasswordConfirmed} = req.body
    let transaction
    try{
        transaction = await sequelize.transaction();
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({
                code: 401,
                message: "Invalid authorization",
                data: []
            });
        }
        const checkKey = await User_keys.findOne({ where: {
            api_token: token,
            tokenType: TokenType.ATHLETE_RESET,
            is_active: true 
            }, order: [['createdAt', 'DESC']], });

        if (!checkKey) {
            return res.status(401).json({
                code: 401,
                message: "Invalid authorization",
                data: []
            });
        }
        const userPayload = jwt.verify(token, process.env.SECRET_KEY);
        if (!userPayload) {
            return res.status(401).json({
                code: 401,
                message: "Invalid authorization",
                data: []
            });
        }
        const { error } = passwordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message,
                data: []
            });
        }
        const user = await User.scope('withHash').findOne({ where: { slug: userPayload.slug } });
        if (!user) {
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            });
        }
        if (newPassword !== newPasswordConfirmed) {
            return res.status(400).json({
                code: 400,
                message: "Passwords do not match",
                data: []
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;

        await user.save({ transaction });
        
        await User_keys.update(
            { is_active: false },
            {
              where: {
                user_slug: user.slug,
                is_active: true 
              },
              transaction
            }
          );
          

        await transaction.commit();

        return res.status(200).json({
            code: 200,
            message: "Password changed successfully",
            data: []
        });

    }
    catch(e){
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function resendOTP(req, res){
    const {mobile_number} = req.body
    try{
        const user = await User.findOne({where:{mobile_number}})
    if(!user){
        return res.status(400).json({ 
            code: 400,
            message: "User not found",
            data: []
        });
    }
    const latestOTP = await User_OTPS.findOne({
        where: { user_slug: user.slug, otp_type: OTPType.RESET, is_active: true },
        order: [['createdAt', 'DESC']]
    });

    if(!latestOTP){
        return res.status(400).json({ 
            code: 404,
            message: "Error. Try forget password again!",
            data: []
        });
    }

    const now = new Date();
    const otpExpiry = new Date(latestOTP.otp_expiry);

    const timeDifference = otpExpiry - now;
    const limit = 570000;
    if (timeDifference > limit) {
        const secondsRemaining = Math.ceil((timeDifference - limit) / 1000);

        return res.status(400).json({
            code: 400,
            message: `Please try again in ${secondsRemaining} seconds!`,
            data : [],
        });
    }

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await User_OTPS.update(
        { is_active: false },
        {
          where: {
            user_slug: user.slug,
            otp_type: OTPType.RESET,
            is_active: true
          }
        }
      );

    const newOTP = await User_OTPS.create({
        otp: otp,
        otp_expiry: expiresAt,
        user_slug: user.slug,
        otp_type: OTPType.RESET,
    })

    await sendOTP(user.mobile_number, otp)

    return res.status(200).json({
        code: 200,
        message: "OTP was resent successfully",
        data: []
    });


    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        });
    }
}

async function editProfile(req, res){
    const { full_name, sport } = req.body;
    const userSlug = req.user.slug;

    try {
        // Validate the request body
        const { error } = editProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error.details[0].message,
                data: [],
            });
        }

        // Find the user by slug
        const user = await User.findOne({ where: { slug: userSlug } });

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                code: 404,
                message: 'User not found',
                data: [],
            });
        }

        if (req.files) {
            const uploadedFile = req.files[0];
            const fileName = Date.now() + '_' + uploadedFile.originalname;
        
            const filePath = path.join('public', fileName);
        
            fs.writeFile(filePath, uploadedFile.buffer, async (err) => {
            if (err) {
                console.error('Error saving file:', err);
                return res.status(500).json({
                    code: 500,
                    message: 'An error occurred while saving the file',
                    data: []
                });
            }
            })
            user.profileImage = filePath
          }

        // Update the user's profile
        if (full_name !== undefined) user.full_name = full_name;
        if (sport !== undefined) user.sporting = sport;

        await user.save();

        if(req.files){
            const protocol = req.protocol;
            const host = req.get('host');
            user.profileImage=protocol + '://'+ host + '/' + user.profileImage.split(path.sep).join('/')
        }

        return res.status(200).json({
            code: 200,
            message: 'Profile updated successfully',
            data: {
                full_name: user.full_name,
                sport: user.sporting,
                profileImage: user.profileImage
            },
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: 'Server error',
            data: e.message,
        });
    }
}

async function enablePushNotifications(req, res){
    const userSlug = req.user.slug;
    try{
        const user = await User.findOne({where: {slug: userSlug}})
        if(!user){
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            })
        }
        if(user.push_notifications==true){
            return res.status(400).json({
                code: 400,
                message: "Push notifications already enabled",
                data: []
            })
        }
        user.push_notifications=true;
        await user.save();

        return res.status(200).json({
            code:200,
            message: "Push notifications enabled",
            data: []
        })

    }
    catch(e){
        console.log(e)
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        })

    }
}

async function disablePushNotifications(req, res){
    const userSlug = req.user.slug;
    try{
        const user = await User.findOne({where: {slug: userSlug}})
        if(!user){
            return res.status(404).json({
                code: 404,
                message: "User not found",
                data: []
            })
        }
        if(user.push_notifications==false){
            return res.status(400).json({
                code: 400,
                message: "Push notifications already disabled",
                data: []
            })
        }
        user.push_notifications=false;
        await user.save();

        return res.status(200).json({
            code:200,
            message: "Push notifications disabled",
            data: []
        })

    }
    catch(e){
        console.log(e)
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        })

    }
}


module.exports = {forgotPassword, verifyOTP, resetPassword, resendOTP, editProfile,
    enablePushNotifications, disablePushNotifications
}
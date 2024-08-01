const bcrypt = require('bcryptjs');
const { sequelize ,User, User_keys, User_OTPS } = require('../connect');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const { UserRole, OTPType, TokenType } = require('../utils/constants');
const { registrationSchema } = require('../utils/inputSchemas')

async function signup (req, res){
    try{

        const { error } = registrationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
	            message: error.details[0].message,
                data: []
            })
        }
        const existingUser = await User.findOne({
            where: {
              [Sequelize.Op.or]: [
                { email: req.body.email },
                { mobile_number: req.body.mobile_number }
              ]
            }
        });
      
        if (existingUser) {
            return res.status(400).json({
                code: 400,
	            message: "Email or Mobile Number already in use",
                data: []
            })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const newUser = await User.create({
            ...req.body,
            password: hashedPassword,
            role: UserRole.USER
        });

        const newOTP = await User_OTPS.create({
            otp:otp,
            otp_expiry: expiresAt,
            user_slug: newUser.slug,
            otp_type: OTPType.VERIFY,
        });

        await sendOTP(newUser.mobile_number, otp)


        return res.status(200).json({
            code: 200,
            message: "User created, proceed to verify",
            data: []
        })
        

    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: e.message,
            data: []
        })
    }
}

async function verifyOTP (req, res){
    let transaction
    try{
        transaction = await sequelize.transaction();
        const {mobile_number, otp} = req.body
        const user = await User.findOne({where:{mobile_number}})
        if(!user){
            return res.status(400).json({
                code: 404,
                message: "User not found",
                data: []
            })
        }
        if(user.otp_verified==true){
            return res.status(400).json({
                code: 400,
                message: "OTP already verified",
                data: []
            })
        }
    
        const now = new Date();
    
        const latestOTP = await User_OTPS.findOne({
            where: { user_slug: user.slug, otp_type: OTPType.VERIFY, is_active: true },
            order: [['createdAt', 'DESC']]
        });

        if (!latestOTP) {
            return res.status(400).json({
                code: 400,
                message: "OTP not generated",
                data: []
            })
        }
        const savedOTP = latestOTP.otp.toString().trim();
        const enteredOTP = otp.toString().trim();

        if (savedOTP !== enteredOTP || now > new Date(latestOTP.otp_expiry)) {
            return res.status(400).json({
                code: 400,
                message: "Invalid or expired OTP",
                data: []
            })
        }

        user.otp_verified = true;

        await User_OTPS.update(
            { is_active: false }, // Set the fields to update
            {
              where: {
                user_slug: user.slug,
                otp_type: OTPType.VERIFY,
                is_active: true
              },
              transaction // Optional: Include transaction if needed
            }
          );
        await user.save({transaction});
        await transaction.commit();

        return res.status(200).json({
            code: 200,
            message: "User verified successfully, proceed to login",
            data: []
        })
        
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

async function login (req, res){
    const { email, password } = req.body;
    let transaction
    try{
        transaction = await sequelize.transaction();
        if (!email || !password) {
            return res.status(400).json({ 
                code: 400,
	            message: "Email/Password not entered",
                data: []
            });
        }

        const user = await User.scope('withHash').findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ 
                code: 404,
	            message: "User not found",
                data: []
            });           
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                code: 401,
	            message: "Invalid Password",
                data: []
            }); 
        }
        if(user.otp_verified==false){
            const otp = generateOTP();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await sendOTP(user.mobile_number, otp)

            await User_OTPS.update(
                { is_active: false },
                {
                  where: {
                    user_slug: user.slug,
                    otp_type: OTPType.VERIFY,
                    is_active: true
                  }
                }
              );

            const newOTP = await User_OTPS.create({
                otp: otp,
                otp_expiry: expiresAt,
                user_slug: user.slug,
                otp_type: OTPType.VERIFY,
                
            })
            
    
            return res.status(310).json({
                code: 310,
	            message: "OTP not verified",
                data: []
            }); 
        }
        const token = jwt.sign({ slug: user.slug, full_name: user.full_name, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });

        const currentKey = await User_keys.findOne({
            where: {
              user_slug: user.slug,
              tokenType: TokenType.ATHLETE_ACCESS,
              is_active: true},
              order: [['createdAt', 'DESC']],
        });

        if(currentKey){
            currentKey.is_active=false;
            await currentKey.save({transaction}); 
        }
        

        const newKey = await User_keys.create({
            api_token: token,
            user_slug: user.slug,
            tokenType: TokenType.ATHLETE_ACCESS
        }, {transaction})


        await transaction.commit()

        return res.status(200).json({
            code: 200,
            message: "Logged in",
            data: {
                slug: user.slug,
                full_name: user.full_name,
                email: user.email,
                mobile_number: user.mobile_number,
                token: token
            }
        })

    }
    catch(e){
        await transaction.rollback()
        console.error(e);
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
            code: 404,
            message: "User not found",
            data: []
        });
    }
    if(user.otp_verified==true){
        return res.status(400).json({ 
            code: 400,
            message: "OTP already verified",
            data: []
        });
    }
    const latestOTP = await User_OTPS.findOne({
        where: { user_slug: user.slug, otp_type: OTPType.VERIFY, is_active: true },
        order: [['createdAt', 'DESC']]
    });

    if(latestOTP){

        const now = new Date();
        const otpExpiry = new Date(latestOTP.otp_expiry);

        const timeDifference = otpExpiry - now;
        const limit = 570000;
        if (timeDifference > limit) {
            const secondsRemaining = Math.ceil((timeDifference - limit) / 1000);

            return res.status(400).json({
                code: 400,
                message: `Please try again in ${secondsRemaining} seconds!`,
                data : []
            });
        }
    }

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await User_OTPS.update(
        { is_active: false },
        {
          where: {
            user_slug: user.slug,
            otp_type: OTPType.VERIFY,
            is_active: true
          }
        }
      );


    const newOTP = await User_OTPS.create({
        otp: otp,
        otp_expiry: expiresAt,
        user_slug: user.slug,
        otp_type: OTPType.VERIFY,
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

function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendOTP(mobile, otp){

    //send otp to mobile number


    console.log('OTP sent at ' + mobile + ': ' + otp)
}


module.exports = {signup, verifyOTP, login, resendOTP, generateOTP, sendOTP}

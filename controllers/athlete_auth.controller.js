const bcrypt = require('bcryptjs');
const { sequelize ,User, User_keys, User_OTPS } = require('../connect');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const Joi = require('joi');


const registrationSchema = Joi.object({
    full_name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    mobile_number: Joi.string().length(11).required(),
    sporting: Joi.string().required(),
    password: Joi.string().min(6).required()
});

async function signup (req, res){
    let transaction;
    try{
        transaction = await sequelize.transaction();

        const { error } = registrationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
	            message: "Error creating user",
	            data : error.details[0].message,
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
	            message: "Email or Mobile Number already in use"
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
            user_role: 'athlete'
        }, { transaction });

        const newOTP = await User_OTPS.create({
            otp:otp,
            otp_expiry: expiresAt,
            user_mobile_number: newUser.mobile_number,
            otp_type: 'verify',
        }, { transaction });

        await sendOTP(newUser.mobile_number, otp)

        await transaction.commit();

        return res.status(200).json({
            code: 200,
            message: "User created, proceed to verify"
        })
        

    }
    catch(e){
        console.error(e);
        await transaction.rollback();
        return res.status(500).json({
            code: 500,
            message: "Server error",
            data: e.message
        })
    }
}

async function verifyOTP (req, res){
    try{
        const {mobile_number, otp} = req.body
        const user = await User.findOne({where:{mobile_number}})
        if(!user){
            return res.status(400).json({
                code: 404,
                message: "Error verifying user",
	            data: "User not found",
            })
        }
        if(user.otp_verified==true){
            return res.status(400).json({
                code: 400,
                message: "Error verifying user",
	            data: "OTP already verified",
            })
        }
    
        const now = new Date();
    
        const latestOTP = await User_OTPS.findOne({
            where: { user_mobile_number: mobile_number, otp_type: 'verify', },
            order: [['createdAt', 'DESC']]
        });

        if (!latestOTP) {
            return res.status(400).json({
                code: 404,
                message: "Error verifying user",
	            data: "OTP not found in database",
            })
        }
        const savedOTP = latestOTP.otp.toString().trim();
        const enteredOTP = otp.toString().trim();

        if (savedOTP !== enteredOTP || now > new Date(latestOTP.otp_expiry)) {
            return res.status(400).json({
                code: 400,
                message: "Error verifying user",
	            data: "Invalid or expired OTP",
            })
        }

        user.otp_verified = true;
        await user.save();

        return res.status(200).json({
            code: 200,
            message: "User verified successfully",
            data: {
                slug: user.slug,
                full_name: user.full_name,
                email: user.email,
                mobile_number: user.mobile_number,
            }
        })
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: "Server error",
            data: e.message
        });
    }
}

async function login (req, res){
    const { email, password } = req.body;

    try{
        if (!email || !password) {
            return res.status(400).json({ 
                code: 400,
	            message: "Error logging in",
	            data : "Email/Password not entered",
            });
        }

        const user = await User.scope('withHash').findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ 
                code: 404,
	            message: "Error logging in",
	            data : "User not found",
            });           
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                code: 401,
	            message: "Error logging in",
	            data : "Invalid Password",
            }); 
        }
        if(user.otp_verified==false){
            const otp = generateOTP();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await sendOTP(user.mobile_number, otp)

            const newOTP = await User_OTPS.create({
                otp: otp,
                otp_expiry: expiresAt,
                user_mobile_number: user.mobile_number,
                otp_type: 'verify',
                
            })
    
            return res.status(310).json({
                code: 401,
	            message: "Error logging in",
	            data : "OTP not verified",
            }); 
        }
        const token = jwt.sign({ slug: user.slug, full_name: user.full_name, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });

        await User_keys.destroy({
            where: {
              user_email: user.email,
              tokenType: 'athlete_access'
            },
          });

        const newKey = User_keys.create({
            jwt_key: token,
            user_email: user.email,
            tokenType: 'athlete_access'
        })

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
        console.error(e);
        return res.status(500).json({
            code: 500,
            message: "Server error",
            data: e.message
        });
    }

}

module.exports = {signup, verifyOTP, login}


function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendOTP(mobile, otp){

    //send otp to mobile number


    console.log('OTP sent at ' + mobile + ': ' + otp)
}
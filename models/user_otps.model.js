const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../connect');
const {OTPType} = require('../utils/constants')

module.exports = model;

function model(sequelize) {
    const User_OTPS = sequelize.define('User_OTP', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: false
        },
        otp_expiry: {
            type: DataTypes.DATE,
            allowNull: false
        },
        otp_type: {
            type: DataTypes.ENUM(...Object.values(OTPType)),
            allowNull: false,
        },
        is_active: {
            type:DataTypes.BOOLEAN,
            defaultValue: true
        },
    }, {
        hooks: {
            beforeCreate: (user_otp, options) => {
                user_otp.slug = uuidv4(); // Assign a UUID before creation
            },
        }
    });

    User_OTPS.associate = function(models) {
        User_OTPS.belongsTo(models.User, {
            foreignKey: 'user_slug',
            targetKey: 'slug',
            as: 'user'
        });
    };

    return User_OTPS;
}

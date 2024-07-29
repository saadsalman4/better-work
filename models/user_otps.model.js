const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../connect');

module.exports = model;

function model(sequelize) {
    const User_OTPS = sequelize.define('User_OTP', {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
          },
        otp: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        otp_expiry: {
            type: DataTypes.DATE,
            allowNull: false
        },
        otp_type:{
            type: DataTypes.ENUM('verify', 'reset'),
            allowNull: false,
        }
    },

       
    );

User_OTPS.associate = function(models) {
    User_OTPS.belongsTo(models.User, {
        foreignKey: 'user_email',
        targetKey: 'email',
        as: 'user'
    });
};

    return User_OTPS;
}
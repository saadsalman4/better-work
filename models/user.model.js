const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const User = sequelize.define('User', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        mobile_number: {
            type: DataTypes.STRING,
            unique: true,
        },
        sporting: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        otp_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        user_role: {
            type: DataTypes.ENUM('athlete', 'coach'),
            allowNull: false
        },
    }, {
        defaultScope: {
            // Exclude password hash by default
            attributes: { exclude: ['password'] },
        },
        scopes: {
            // Include hash with this scope
            withHash: { attributes: {}, },
        },
        hooks: {
            beforeCreate: (user, options) => {
                user.slug = uuidv4(); // Assign a UUID before creation
            },
        }
    });

    User.associate = function(models) {
        User.hasMany(models.User_keys, {
            foreignKey: 'user_email',
            sourceKey: 'email',
            as: 'keys'
        });
        User.hasMany(models.User_OTPS, {
            foreignKey: 'user_mobile_number',
            sourceKey: 'mobile_number',
            as: 'otps'
        });
    };

    return User;
}

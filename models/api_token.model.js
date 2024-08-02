const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {TokenType} = require('../utils/constants')

module.exports = model;

function model(sequelize) {
    const User_keys = sequelize.define('api_tokens', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        api_token: {
            type: DataTypes.STRING(1024),
            allowNull: false,
        },
        tokenType: {
            type: DataTypes.ENUM(...Object.values(TokenType)),
            allowNull: false,
        },
        is_active : {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    }, {
        hooks: {
            beforeCreate: (user_key, options) => {
                user_key.slug = uuidv4(); // Assign a UUID before creation
            },
        }
    });

    User_keys.associate = function(models) {
        User_keys.belongsTo(models.User, {
            foreignKey: 'user_slug',
            targetKey: 'slug',
            as: 'user'
        });
    };

    return User_keys;
}

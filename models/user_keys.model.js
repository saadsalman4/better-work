const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const User_keys = sequelize.define('UserKey', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        jwt_key: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tokenType: {
            type: DataTypes.ENUM('athlete_access', 'coach_access', 'reset'),
            allowNull: false,
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
            foreignKey: 'user_email',
            targetKey: 'email',
            as: 'user'
        });
    };

    return User_keys;
}

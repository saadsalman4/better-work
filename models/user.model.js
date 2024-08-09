const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { UserRole } = require('../utils/constants');

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
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        profileImage:{
            type: DataTypes.STRING,
            allowNull: true
        },
        otp_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        push_notifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
            references: {
                model: 'Roles',
                key: 'role',
            },
        },
    }, {
        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        scopes: {
            withHash: { attributes: {}, },
        },
        hooks: {
            beforeCreate: (user, options) => {
                user.slug = uuidv4();
            },
        }
    });

    User.associate = function(models) {
        User.hasMany(models.User_keys, {
            foreignKey: 'user_slug',
            sourceKey: 'slug',
            as: 'keys',
            onDelete: 'CASCADE',
        });
        User.hasMany(models.User_OTPS, {
            foreignKey: 'user_slug',
            sourceKey: 'slug',
            as: 'otps',
            onDelete: 'CASCADE',
        });

        User.hasMany(models.Posts_Workouts, {
            foreignKey: 'user_slug',
            sourceKey: 'slug',
            as: 'posts_workouts',
            onDelete: 'CASCADE',
        });

        User.hasMany(models.WorkoutSession, {
            foreignKey: 'user_slug',
            sourceKey: 'slug',
            as: 'sessions',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

        User.hasMany(models.WorkoutLog, {
            foreignKey: 'user_slug',
            sourceKey: 'slug',
            as: 'log',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

        User.belongsTo(models.Role, {
            foreignKey: 'role',
            targetKey: 'role',
            as: 'roleDetails',
        });

        User.hasMany(models.Relationship, { as: 'followers', foreignKey: 'followed_id' });
        User.hasMany(models.Relationship, { as: 'followings', foreignKey: 'follower_id' });
    };

    return User;
}

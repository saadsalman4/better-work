const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const Saves = sequelize.define('Saves', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        user_slug: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users', // Assuming the User model is named 'Users'
                key: 'slug',
            },
        },
        post_slug: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'posts_workouts',
                key: 'slug',
            },
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    Saves.associate = function(models) {
        Saves.belongsTo(models.User, {
            foreignKey: 'user_slug',
            targetKey: 'slug',
            as: 'user'
        });
        Saves.belongsTo(models.Posts_Workouts, {
            foreignKey: 'post_slug',
            targetKey: 'slug',
            as: 'post'
        });
    };

    return Saves;
}

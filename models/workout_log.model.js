const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = function(sequelize) {
    const WorkoutLog = sequelize.define('workout_log', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        hours: {
            type: DataTypes.FLOAT,
            allowNull: false
        }
    });

    WorkoutLog.associate = function(models) {
        WorkoutLog.belongsTo(models.User, {
            foreignKey: 'user_slug',
            targetKey: 'slug',
            as: 'user_',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return WorkoutLog;
};
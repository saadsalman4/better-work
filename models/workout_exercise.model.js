const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const workoutExercise = sequelize.define('workout_exercise', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        posts_workouts_slug: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'posts_workouts',
                key: 'slug',
            },
        },
    });

    workoutExercise.associate = function(models) {
        workoutExercise.belongsTo(models.Posts_Workouts, {
            foreignKey: 'posts_workouts_slug',
            targetKey: 'slug',
            as: 'workout',
        });
    };

    return workoutExercise;
};

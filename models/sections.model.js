const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const Sections = sequelize.define('Sections', {
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
        posts_workouts_slug: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'posts_workouts',
                key: 'slug',
            },
        },
    });

    Sections.associate = function(models) {
        Sections.belongsTo(models.Posts_Workouts, {
            foreignKey: 'posts_workouts_slug',
            targetKey: 'slug',
            as: 'postsWorkouts',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

        Sections.hasMany(models.templateExercises, {
            foreignKey: 'section_slug',
            sourceKey: 'slug',
            as: 'exercises',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return Sections;
};

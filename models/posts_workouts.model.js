const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {PostType} = require('../utils/constants')

module.exports = model;

function model(sequelize) {
    const Posts_Workouts = sequelize.define('posts_workouts', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(PostType)),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        media : {
            type: DataTypes.STRING,
            allowNull: true
        },
        description : {
            type: DataTypes.STRING,
            allowNull: true
        },
        tag : {
            type: DataTypes.STRING,
            allowNull: true
        },
        price : {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        shared_from: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'posts_workouts', // Self-referential relationship
                key: 'slug',
            },
        },
        sharer_caption: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        hooks: {
            beforeCreate: (user_key, options) => {
                user_key.slug = uuidv4(); // Assign a UUID before creation
            },
        }
    });

    Posts_Workouts.associate = function(models) {
        Posts_Workouts.hasMany(models.Sections, {
            foreignKey: 'posts_workouts_slug',
            sourceKey: 'slug',
            as: 'sections'
        });

        Posts_Workouts.hasMany(models.workoutExercise, {
            foreignKey: 'posts_workouts_slug',
            sourceKey: 'slug',
            as: 'workouts'
        });

        Posts_Workouts.belongsTo(models.User, {
            foreignKey: 'user_slug',
            sourceKey: 'slug',
            as: 'user'
        });

        Posts_Workouts.belongsTo(models.Posts_Workouts, {
            foreignKey: 'shared_from',
            as: 'originalPost',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            
        });

        Posts_Workouts.hasMany(models.Comment, { as: 'comments', foreignKey: 'post_slug' }); // Define association with Comment

    };

    return Posts_Workouts;
}

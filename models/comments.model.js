const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const Comment = sequelize.define('Comment', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        post_slug: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Posts_Workouts', // Ensure this matches your Posts_Workouts table name
                key: 'slug'
            },
        },
        user_slug: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users', // Change this to match your actual User table name
                key: 'slug'
            },
        },
        comment_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        hooks: {
            beforeCreate: (comment, options) => {
                comment.slug = uuidv4(); // Assign a UUID before creation
            },
        },
    });

    Comment.associate = function(models) {
        Comment.belongsTo(models.Posts_Workouts, { foreignKey: 'post_slug', as: 'post' });
        Comment.belongsTo(models.User, { foreignKey: 'user_slug', as: 'commenter' }); // Ensure `User` matches your model name
    };

    return Comment;
}

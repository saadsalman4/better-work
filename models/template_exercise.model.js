const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const templateExercises = sequelize.define('template_exercise', {
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
        intensity : {
            type: DataTypes.STRING,
            allowNull: false
        },
        standard_time : {
            type: DataTypes.STRING,
            allowNull: false
        },
        goal_time : {
            type: DataTypes.STRING,
            allowNull: false
        },
        notes : {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        hooks: {
            beforeCreate: (user_key, options) => {
                user_key.slug = uuidv4(); // Assign a UUID before creation
            },
        }
    });

    templateExercises.associate = function(models) {
        templateExercises.belongsTo(models.Sections, {
            foreignKey: 'section_slug',
            targetKey: 'slug',
            as: 'section',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return templateExercises;
}

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const WorkoutSession = sequelize.define('Workout_Session', {
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
        },
        check_in: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        check_out: {
            type: DataTypes.DATE,
            allowNull: true, // Allow null if the user hasn't checked out yet
        },
        duration: {
            type: DataTypes.FLOAT, // Duration in hours
            allowNull: true,
            defaultValue: 0.0,
        },
    }, {
        hooks: {
            beforeCreate: (session, options) => {
                session.slug = uuidv4(); // Assign a UUID before creation
            },
            beforeSave: (session, options) => {
                if (session.check_in && session.check_out) {
                    const diff = new Date(session.check_out) - new Date(session.check_in);
                    session.duration = diff / (1000 * 60 * 60); // Convert milliseconds to hours
                }
            },
        },
    });

    WorkoutSession.associate = function(models) {
        WorkoutSession.belongsTo(models.User, {
            foreignKey: 'user_slug',
            targetKey: 'slug',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    };

    return WorkoutSession;
}

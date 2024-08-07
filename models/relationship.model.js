const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = model;

function model(sequelize) {
    const Relationship = sequelize.define('Relationship', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        follower_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        followed_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        hooks: {
            beforeCreate: (relationship, options) => {
                relationship.slug = uuidv4(); // Assign a UUID before creation
            },
        }
    });

    Relationship.associate = function(models) {
        Relationship.belongsTo(models.User, { as: 'follower', foreignKey: 'follower_id' });
        Relationship.belongsTo(models.User, { as: 'followed', foreignKey: 'followed_id' });
    };

    return Relationship;
}
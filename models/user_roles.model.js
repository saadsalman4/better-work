const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { UserRole } = require('../utils/constants');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        slug: {
            type: DataTypes.UUID,
            defaultValue: uuidv4,
            unique: true,
            primaryKey: true,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
            unique: true,
        },
    });

    return Role;
};

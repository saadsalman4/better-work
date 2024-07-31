const { Role } = require('../connect'); // Import the Role model

const initializeRoles = async () => {
    const initialRoles = [
        { role: 'admin' },
        { role: 'user' },
    ];

    try {
        await Role.bulkCreate(initialRoles, { ignoreDuplicates: true });
        console.log('Roles initialized');
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
};

initializeRoles(); // Call the function to initialize roles

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('betterWork', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

// const Owner = require('./models/owner/owner.model')(sequelize);

const db = {
    sequelize,
    // Owner,

  };
  
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  }); 
  
  
  sequelize.sync()
    .then(() => {
      console.log('Database & tables created!');
    })
    .catch(error => console.log('This error occurred:', error));
  
    module.exports = db;
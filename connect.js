const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('betterWork', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

const User = require('./models/user.model')(sequelize);
const User_keys = require('./models/user_keys.model')(sequelize);
const User_OTPS = require('./models/user_otps.model')(sequelize);

const db = {
  sequelize,
  User,
  User_keys,
  User_OTPS
};

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}); 

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Database & tables created or updated!');
  })
  .catch(error => console.log('This error occurred:', error));

module.exports = db;

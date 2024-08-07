const { Sequelize, DataTypes } = require('sequelize');
const { FORCE } = require('sequelize/lib/index-hints');
const sequelize = new Sequelize('betterWork', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

const User = require('./models/user.model')(sequelize);
const User_keys = require('./models/api_token.model')(sequelize);
const User_OTPS = require('./models/user_otps.model')(sequelize);
const Role = require('./models/user_roles.model')(sequelize)
const Posts_Workouts = require('./models/posts_workouts.model')(sequelize)
const Sections = require('./models/sections.model')(sequelize)
const templateExercises = require('./models/template_exercise.model')(sequelize)
const workoutExercise = require('./models/workout_exercise.model')(sequelize)
const WorkoutSession = require('./models/workout_sessions.model')(sequelize)
const WorkoutLog = require('./models/workout_log.model')(sequelize)
const Relationship = require('./models/relationship.model')(sequelize)

const db = {
  sequelize,
  User,
  Role,
  User_keys,
  User_OTPS,
  Posts_Workouts,
  Sections,
  templateExercises,
  workoutExercise,
  WorkoutSession,
  WorkoutLog,
  Relationship
};

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}); 

sequelize.sync() 
  .then(() => {
    console.log('Database & tables created or updated!');
  })
  .catch(error => console.log('This error occurred:', error));

module.exports = db;

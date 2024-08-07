const dotenv = require('dotenv');
dotenv.config();
const express = require('express')
const app = express()
const port = 3000
const connect = require("./connect");
const multer = require('multer')
const upload = multer()
const path = require('path')

const rolesAdding = require('./utils/addRoles')

app.use(upload.any())
app.use('/public', express.static(path.join(__dirname, 'public')));

const athleteAuthRoutes = require('./routes/athlete_auth.routes')
const athleteAccountRoutes = require('./routes/athlete_account.routes')
const postsWorkoutRoutes = require('./routes/posts_workouts.routes')
const workoutProgressRoutes = require('./routes/workout_progress.routes')
const profileRoutes = require('./routes/profile.routes')
const socialRoutes = require('./routes/socials.routes')

app.use(express.json())

//routes
app.use('/api/athlete', athleteAuthRoutes)
app.use('/api/athlete/account', athleteAccountRoutes)
app.use('/api/postsworkouts', postsWorkoutRoutes)
app.use('/api/progress', workoutProgressRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/social', socialRoutes)



app.listen(port, () => console.log(`App listening at http://localhost:3000`))
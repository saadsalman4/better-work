const dotenv = require('dotenv');
dotenv.config();
const express = require('express')
const app = express()
const port = 3000
const connect = require("./connect");
const multer = require('multer')
const upload = multer()

app.use(upload.any())

const athleteAuthRoutes = require('./routes/athlete_auth.routes')
const athleteAccountRoutes = require('./routes/athlete_account.routes')

const addRole = require('./utils/addRole')

app.use(express.json())

//routes
app.use('/api/athlete', athleteAuthRoutes)
app.use('/api/athlete/account', athleteAccountRoutes)

app.use('/temp', addRole)



app.listen(port, () => console.log(`App listening at http://localhost:3000`))
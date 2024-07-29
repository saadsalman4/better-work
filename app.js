const express = require('express')
const app = express()
const port = 3000
const connect = require("./connect");

app.use(express.json())



app.listen(port, () => console.log(`App listening at http://localhost:3000`))
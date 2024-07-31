const express = require("express");
const { userAuth } = require('../middlewares/authCheck');
const {createPost} = require('../controllers/posts_workouts.controller')

const router = express.Router();

router.post('/create-post', userAuth, createPost);

module.exports = router;
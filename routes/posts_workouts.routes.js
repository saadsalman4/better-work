const express = require("express");
const { userAuth } = require('../middlewares/authCheck');
const {createPost, createWorkout } = require('../controllers/posts_workouts.controller')

const router = express.Router();

router.post('/create-post', userAuth, createPost);
router.post('/create-workout', userAuth, createWorkout)

module.exports = router;
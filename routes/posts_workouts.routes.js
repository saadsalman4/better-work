const express = require("express");
const { userAuth } = require('../middlewares/authCheck');
const {createPost, createWorkout, createTemplate } = require('../controllers/posts_workouts.controller')

const router = express.Router();

router.post('/create-post', userAuth, createPost);
router.post('/create-workout', userAuth, createWorkout)
router.post('/create-template', userAuth, createTemplate)

module.exports = router;
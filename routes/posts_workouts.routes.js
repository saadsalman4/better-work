const express = require("express");
const { userAuth } = require('../middlewares/authCheck');
const {createPost, createWorkout, createTemplate, updatePost, 
    updateWorkout, updateTemplate, viewAll, viewPosts, 
    viewWorkouts,
    viewTemplates} = require('../controllers/posts_workouts.controller')

const router = express.Router();

router.post('/create-post', userAuth, createPost);
router.post('/create-workout', userAuth, createWorkout)
router.post('/create-template', userAuth, createTemplate)

router.post('/update-post/:slug', userAuth, updatePost)
router.post('/update-workout/:slug', userAuth, updateWorkout)
router.post('/update-template/:slug', userAuth, updateTemplate)

router.get('/view-all', userAuth, viewAll)
router.get('/view-posts', userAuth, viewPosts)
router.get('/view-workouts', userAuth, viewWorkouts)
router.get('/view-templates', userAuth, viewTemplates)


module.exports = router;
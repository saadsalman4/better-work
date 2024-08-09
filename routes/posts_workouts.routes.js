const express = require("express");
const { userAuth } = require('../middlewares/authCheck');
const {createPost, createWorkout, createTemplate, updatePost, 
    updateWorkout, updateTemplate, viewAll, viewPosts, 
    viewWorkouts, viewTemplates, workoutView, postView, templateView,
    deletePost, deleteWorkout, deleteTemplate,
    sharePost,
    viewFollowingPosts,
    viewForYouPosts,
    savePost,
    unsavePost,
    getSavedPosts} = require('../controllers/posts_workouts.controller');

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

router.get('/view-post/:slug', userAuth, postView)
router.get('/view-workout/:slug', userAuth, workoutView)
router.get('/view-template/:slug', userAuth, templateView)

router.delete('/delete-post/:slug', userAuth, deletePost)
router.delete('/delete-workout/:slug', userAuth, deleteWorkout)
router.delete('/delete-template/:slug', userAuth, deleteTemplate)

router.post('/share-post/:originalPostSlug', userAuth, sharePost)

router.get('/following-posts', userAuth, viewFollowingPosts)
router.get('/for-you-posts', userAuth, viewForYouPosts)

router.post('/save-post/:postSlug', userAuth, savePost)
router.delete('/unsave-post/:postSlug', userAuth, unsavePost)
router.get('/saved-posts', userAuth, getSavedPosts)

module.exports = router;
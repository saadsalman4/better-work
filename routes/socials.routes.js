const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { followUser, unfollowUser, getFollowers, 
    getFollowing, likePost, removeLike, addComment, updateComment, deleteComment } = require('../controllers/socials.controller')

const router = express.Router();

router.post('/follow/:followSlug', userAuth, followUser)
router.patch('/unfollow/:unfollowSlug', userAuth, unfollowUser)
router.get('/followers', userAuth, getFollowers)
router.get('/following', userAuth, getFollowing)

router.post('/like-post/:postSlug', userAuth, likePost)
router.delete('/remove-like/:postSlug', userAuth, removeLike)

router.post('/add-comment', userAuth, addComment)
router.patch('/update-comment', userAuth, updateComment)
router.delete('/delete-comment', userAuth, deleteComment)

module.exports = router;
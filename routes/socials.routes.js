const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/socials.controller')

const router = express.Router();

router.post('/follow/:followSlug', userAuth, followUser)
router.patch('/unfollow/:unfollowSlug', userAuth, unfollowUser)
router.get('/followers', userAuth, getFollowers)
router.get('/following', userAuth, getFollowing)

module.exports = router;
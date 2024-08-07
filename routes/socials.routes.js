const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { followUser, unfollowUser, getFollowers } = require('../controllers/socials.controller')

const router = express.Router();

router.post('/follow/:followSlug', userAuth, followUser)
router.patch('/unfollow/:unfollowSlug', userAuth, unfollowUser)
router.get('/followers', userAuth, getFollowers)

module.exports = router;
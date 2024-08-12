const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { myPosts, myWorkouts, myShares, myFollowersCount, myFollowingCount, myProfile, viewUserProfile } = require("../controllers/profile.controller");

const router = express.Router();

router.get('/my-posts', userAuth, myPosts)
router.get('/my-workouts', userAuth, myWorkouts)
router.get('/my-shares', userAuth, myShares)

router.get('/follower-count', userAuth, myFollowersCount)
router.get('/following-count', userAuth, myFollowingCount)

router.get('/my-profile', userAuth, myProfile)
router.get('/user/:profileUserSlug', userAuth, viewUserProfile)

module.exports = router;
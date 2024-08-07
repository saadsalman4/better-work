const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { myPosts, myWorkouts, myShares, myFollowersCount, myFollowingCount } = require("../controllers/profile.controller");

const router = express.Router();

router.get('/my-posts', userAuth, myPosts)
router.get('/my-workouts', userAuth, myWorkouts)
router.get('/my-shares', userAuth, myShares)

router.get('/follower-count', userAuth, myFollowersCount)
router.get('/following-count', userAuth, myFollowingCount)

module.exports = router;
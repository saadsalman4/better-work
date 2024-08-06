const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { myPosts, myWorkouts, myShares } = require("../controllers/profile.controller");

const router = express.Router();

router.get('/my-posts', userAuth, myPosts)
router.get('/my-workouts', userAuth, myWorkouts)
router.get('/my-shares', userAuth, myShares)

module.exports = router;
const express = require("express");
const { userAuth } = require("../middlewares/authCheck");
const { checkIn, checkOut, getCurrentSessionDuration, getUserProgress, getTotalDuration } = require("../controllers/workout_progress.controller");

const router = express.Router();

router.post('/check-in', userAuth, checkIn)
router.patch('/check-out', userAuth, checkOut)
router.get('/current-session', userAuth, getCurrentSessionDuration)
router.get('/total-duration', userAuth, getTotalDuration)
router.get('/user', userAuth, getUserProgress)


module.exports = router;
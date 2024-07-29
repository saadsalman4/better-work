const express = require("express");
const {  signup, verifyOTP, login } = require("../controllers/athlete_auth.controller");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP)
router.post("/login", login)

module.exports = router;
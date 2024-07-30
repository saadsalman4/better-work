const express = require("express");
const { forgotPassword, verifyOTP, resetPassword, resendOTP } = require("../controllers/athlete_account.controller");

const router = express.Router();

router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)
router.post('/resend-otp', resendOTP)

module.exports = router;
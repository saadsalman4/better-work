const express = require("express");
const { forgotPassword, verifyOTP, resetPassword, resendOTP,
    editProfile, enablePushNotifications, disablePushNotifications} = require("../controllers/athlete_account.controller");
const { userAuth } = require('../middlewares/authCheck');

const router = express.Router();

router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)
router.post('/resend-otp', resendOTP)

router.patch('/edit-profile', userAuth, editProfile)
router.patch('/enable-push-notifications', userAuth, enablePushNotifications)
router.patch('/disable-push-notifications', userAuth, disablePushNotifications)


module.exports = router;
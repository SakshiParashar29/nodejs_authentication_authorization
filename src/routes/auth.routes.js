const express = require('express');
const { registerUserHandler, loginUserHandler, verifyEmailHandler, refreshHandler, logOutUser, forgetPassword, resetPassword } = require('../controllers/auth.controller');
const { googleAuthStartHandler, googleAuthCallbackHandler } = require('../controllers/google.auth.controller');

const router = express.Router();

router.post('/register', registerUserHandler);
router.post('/login', loginUserHandler);
router.get('/verify-email', verifyEmailHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logOutUser);
router.post('/forgot-password', forgetPassword);
router.post('/reset-password', resetPassword);

//google routes
router.get('/google', googleAuthStartHandler);
router.get('/google/callback', googleAuthCallbackHandler);

module.exports = router;
const express = require('express');
const { registerUserHandler, loginUserHandler, verifyEmailHandler, refreshHandler, logOutUser, forgetPassword, resetPassword } = require('../controllers/auth.controller');
const { googleAuthStartHandler, googleAuthCallbackHandler } = require('../controllers/google.auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {twoFactorSetupHandler, twoFAVerifyHandler} = require('../controllers/two-step.controller');

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

//2FA authentication routes
router.post('/2fa/setup', authMiddleware, twoFactorSetupHandler);
router.post('/2fa/verify', authMiddleware, twoFAVerifyHandler);

module.exports = router;
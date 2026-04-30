const express = require('express');
const { registerUserHandler, loginUserHandler, verifyEmailHandler, refreshHandler, logOutUser, forgetPassword, resetPassword } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', registerUserHandler);
router.post('/login', loginUserHandler);
router.get('/verify-email', verifyEmailHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logOutUser);
router.post('/forgot-password', forgetPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
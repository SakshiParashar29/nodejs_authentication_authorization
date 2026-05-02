/*
   Here, we will create two methods, first for setting up two-factor verification.

   and second one to verify
 */

   const User = require('../models/user.model');
   const { authenticator } = require('otplib');

// setup

const twoFactorSetupHandler = async(req, res) => {
    try {
      const authUser = req.user;

      if(!authUser){
        return res.status(401).json({
            message: "User is not authenticated"
        });
      }

      const user = await User.findById(authUser.id);

      if(!user){
        return res.status(404).json({
            message: "Invalid user"
        });
      }

      console.log(authenticator);

      const secret = authenticator.generateSecret();

      const issuer = 'NodeAuthApp'; // to identify for what we are creating

      const otpAuthUrl = authenticator.keyuri(user.email, issuer, secret);

      user.twoFactorSecret = secret;
      user.twoFactorEnabled = false;

      await user.save();

      return res.json({
        message: "Two factor setup successfully",
        otpAuthUrl,
        secret
      });

    } catch (error) {
        console.log('Error in twoFactorSetupHandler -> ', error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// verify

const twoFAVerifyHandler = async (req, res) => {
    try {
      const authUser = req.user;

      if(!authUser){
        return res.status(401).json({
            message: "User is not authenticated"
        });
      }

      const {twoFactorCode} = req.body;
      
      if(!twoFactorCode){
        return res.status(400).json({
            message: "Two factor code is required"
        });
      }

      const user = await User.findById(authUser.id);

      if(!user){
        return res.status(404).json({
            message: "User not found"
        });
      }

      if(!user.twoFactorSecret){
        return res.status(400).json({
            message: "You don't have 2fa setup yet"
        });
      }

      const isValid = authenticator.verify({token: twoFactorCode, secret: user.twoFactorSecret});

      if(!isValid){
        return res.status(400).json({
            message: "Invalid two factor code"
        });
      }

      user.twoFactorEnabled = true;

      await user.save();

      return res.json({
        message: "Two factor enabled successfully",
        twoFactorEnabled: true
      });

    } catch (error) {
        console.log('Error in twoFactorSetupHandler -> ', error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

module.exports = {twoFactorSetupHandler, twoFAVerifyHandler}
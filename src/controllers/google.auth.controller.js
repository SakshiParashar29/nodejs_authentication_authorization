const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const crypto = require('crypto');
const hashPassword = require('../lib/hash');
const { createAccessToken, createRefreshToken } = require('../lib/token');

/*
  Here we need two functions, first which will start the authentication and second which will handle the callback
 */
function getGoogleClient() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectURL = process.env.GOOGLE_REDIRECT_URI

    if (!clientID || !clientSecret) {
        throw new Error('Google client Id and secret are required!!');
    }

    return new OAuth2Client(
        clientID,
        clientSecret,
        redirectURL
    );
}

const googleAuthStartHandler = (req, res) => {
    try {
        const client = getGoogleClient();

        // creating scoppe means telling google what are the information we need once loggin is successfull

        const url = client.generateAuthUrl(
            {
                access_type: 'offline',
                prompt: 'consent',
                scope: ['openid', 'email', 'profile']
            }
        );

        return res.redirect(url);

    } catch (error) {
        console.log("Error in googleAuthStartHandler -> ", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

const googleAuthCallbackHandler = async (req, res) => {
    try {
        const code = req.query.code;

        if (!code) {
            return res.status(400).json({
                message: "Missing code in callback"
            });
        }

        const client = getGoogleClient();

        const { tokens } = await client.getToken(code);

        // console.log(tokens);

        if (!tokens.id_token) {
            return res.status(400).json({
                message: "No google id_token is present"
            });
        }

        // verify id token and read the user info from it

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        console.log(payload);

        const email = payload?.email;
        const emailVerified = payload?.email_verified;

        if (!emailVerified) {
            return res.status(400).json({
                message: "Email is not verified"
            });
        }

        const normalisedEmail = email.toLowerCase().trim();

        let user = await User.findOne({ email: normalisedEmail });

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString();

            const passwordHash = await hashPassword(randomPassword);

            user = await User.create({
                email: normalisedEmail,
                passwordHash,
                role: "user",
                isEmailVerified: true,
                twoFactorEnabled: false
            });

            const accessToken = createAccessToken(user.id, user.role, user.tokenVersion);

            const refreshToken = createRefreshToken(user.id, user.tokenVersion);

            const isProd = process.env.NODE_ENV === 'production';

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({
                message: "Google login successful",
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                }
            });

        } else {
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                await user.save();
            }

            const accessToken = createAccessToken(user.id, user.role, user.tokenVersion);
            const refreshToken = createRefreshToken(user.id, user.tokenVersion);

            const isProd = process.env.NODE_ENV === 'production';

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({
                message: "Google login successful",
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                }
            });
        }


    } catch (error) {
        console.log("Error in googleAuthCallbackHandler -> ", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


module.exports = { googleAuthStartHandler, googleAuthCallbackHandler }
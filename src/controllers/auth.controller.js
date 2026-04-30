const jwt = require('jsonwebtoken');
const hashPassword = require('../lib/hash');
const User = require('../models/user.model');
const { validateRegister, validateLogin } = require('../utils/validate');
const sendEmail = require('../lib/email');
const { createAccessToken, createRefreshToken, verifyRefreshToken } = require('../lib/token');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


function getAppUrl() {
    return process.env.APP_URL || `http://localhost:${process.env.PORT}`;
}

const registerUserHandler = async (req, res) => {
    try {
        const result = validateRegister.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data!!", errors: result.error.flatten()
            })
        }

        const { email, password, name } = result.data;

        const normalisedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalisedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "Email is already in use!! Please try again with another email",
                success: false
            });
        }

        const passwordHash = await hashPassword(password);

        const user = await User.create({
            email: normalisedEmail,
            passwordHash,
            name,
            role: 'user',
            isEmailVerified: false,
            twoFactorEnabled: false
        });

        // email verification
        const verifyToken = jwt.sign(
            { sub: user.id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "1D" }
        )

        const verifyURL = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;

        await sendEmail(
            user.email,
            'Verify your Email',
            `
             <p> please verify your email by clicking on this link: </p>
             <p> <a href="${verifyURL}"> ${verifyURL}</a> </p>
            `
        );

        await user.save();

        return res.status(200).json({
            success: true,
            message: "New user created",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        })
    } catch (error) {
        console.log("Error in register User -> ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const verifyEmailHandler = async (req, res) => {
    try {
        const token = req.query.token;

        if (!token) {
            return res.status(400).json({ message: "Verification token needed!!" });
        }

        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        if (user.isEmailVerified) {
            return res.json({
                message: "email is already verified"
            });
        }

        user.isEmailVerified = true;
        await user.save();

        return res.json({
            message: "Email verified successfully!!"
        });

    } catch (error) {
        console.log("Error in verifyEmailHandler -> ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const loginUserHandler = async (req, res) => {
    try {
        const result = validateLogin.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data!!",
                errors: result.error.flatten()
            });
        }

        const { email, password } = result.data;

        const normalisedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalisedEmail });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Email or Password"
            });
        }

        const ispasswordCorrect = await bcrypt.compare(password, user.passwordHash);

        if (!ispasswordCorrect) {
            return res.status(400).json({
                message: "Incorrect Password!"
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: "Please verify your email befor logging in!!"
            });
        }

        const accessToken = createAccessToken(user.id, user.role, user.tokenVersion);

        const refreshToken = createRefreshToken(user.id, user.tokenVersion);

        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            message: "Login successfully done",
            token: accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        console.log("Error in login User -> ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

const refreshHandler = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;


        if (!token) {
            return res.status(401).json({
                message: "Invalid token!"
            })
        }

        const payload = verifyRefreshToken(token);

        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(400).json({
                message: "User ot found"
            });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.status(401).json(
                {
                    message: "Invalid refresh token"
                }
            )
        }



        const newAccessToken = createAccessToken(user.id, user.role, user.tokenVersion);

        const newRefreshToken = createRefreshToken(user.id, user.tokenVersion);

        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Token refreshed",
            newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });

    } catch (error) {
        console.log("Error in refresh Handler -> ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const logOutUser = async (req, res) => {
    try {
        res.clearCookie('refreshToken', { path: '/' });

        return res.status(200).json({
            message: "Logged out successfully!"
        });
    } catch (error) {
        console.log("Error in logOutUser -> ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const normalisedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalisedEmail });

        if (!user) {
            return res.status(404).json({
                message: "If an account with this email exists, we will send you an reset link"
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken = tokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 5 * 60 * 1000);

        await user.save();

        const resetURL = `${getAppUrl()}/auth/reset-password?token=${rawToken}`;

        await sendEmail(
            user.email,
            "Reset Your Password",
            `<p> Click on the link to reset your password: <a href=${resetURL}> ${resetURL} </a> </p>`
        );

        return res.json({
            message: "If an account with this email exists, we will send you a reset link!"
        });

    } catch (error) {
        console.log("Error in forgetPassword -> ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const resetPassword = async (req, res) => {
    const { newPassword, token } = req.body;

    if (!token) {
        return res.status(400).json({
            message: "Token is missing"
        });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            message: "Password must be greater than or equal to length 6"
        });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expire token"
            });
        }

        const newPasswordHash = await hashPassword(newPassword);

        user.passwordHash = newPasswordHash;
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.tokenVersion = user.tokenVersion + 1;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully!"
        })

    } catch (error) {
        console.log("Error in resetPassword -> ", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = { registerUserHandler, verifyEmailHandler, loginUserHandler, refreshHandler, logOutUser, forgetPassword, resetPassword };
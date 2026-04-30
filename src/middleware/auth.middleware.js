const { verifyAccessToken } = require("../lib/token");
const User = require("../models/user.model");


const authMiddleware = async(req, res, next) => {
    try {
        const authHeaders = req.headers.authorization;

        if(!authHeaders || !authHeaders.startsWith('Bearer ')){
            return res.status(401).json({
                message: "you are not auth user!!"
            });
        }

        const token = authHeaders && authHeaders.split(' ')[1];

        if(!token){
           return res.status(401).json({
            message: "Token is missing"
           });
        }

        const payload = verifyAccessToken(token);

        const user = await User.findById(payload.sub);

        if(!user){
            return res.status(400).json({
                message: "User not found"
            });
        }

        if(user.tokenVersion !== payload.tokenVersion){
            return res.status(401).json({
                message: "token invalidated"
            });
        }

        req.user = {
           id: user.id,
           email: user.email,
           name: user.name,
           role: user.role,
           isEmailVerified: user.isEmailVerified
        }

        next();

    } catch (error) {
        console.log("Error in authmiddleware -> ", error);
    }
}

module.exports = authMiddleware;
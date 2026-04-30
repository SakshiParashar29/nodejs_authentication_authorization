
const roleMiddleware = (role) => (req, res, next) => {
    try {
        if(req.user.role !== role){
            return res.status(403).json({
                message: `Unauthorized!! Needed ${role} rights`
            });
        }
        next();
    } catch (error) {
        console.log("Error in roleMiddleware", error);
    }
}

module.exports = roleMiddleware;
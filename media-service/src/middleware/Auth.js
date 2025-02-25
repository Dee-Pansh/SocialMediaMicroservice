const logger = require("../utils/logger");


const AuthenticationRequest = (req, res, next) => {
    try { 
        const userId = req.headers["x-user-id"];
        if(!userId)
        {
            logger.warn("Access attempted without user ID");
            return res.status(401).json({
                success:false,
                message:"Authentication required! Please login to continue"
            })
        };
        req.user = {userId};
        next();
    }
    catch {
        res.status(400).json({
            success: false,
            message: "Error while authenticating"
        });
    }
}

module.exports = AuthenticationRequest;
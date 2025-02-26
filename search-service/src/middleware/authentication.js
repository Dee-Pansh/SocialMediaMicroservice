const authentication = (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            logger.warn("Access attempted without user Id");
            return res.status(401).json({
                success: false,
                message: "Authentication required! Login again"
            });
        }
        req.user = { userId };
        next();
    } catch (error) {
        throw error;
    }

}
module.exports = authentication;
const logger = require("./logger");

const globalErrorHandler = (err, req, res, next) => {
    logger.error(err.message || "Something went wrong");
    return res.status(err.status || 500).json({
        success: false,
        error: err.message || "Something went wrong"
    })
}
module.exports = globalErrorHandler;
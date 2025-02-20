const errorHandler = (err, req, res, next) => {
    logger.error(err.message || "Something went wrong");
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Something went wrong"
    })
}
module.exports = errorHandler;
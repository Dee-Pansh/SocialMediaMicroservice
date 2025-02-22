const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
  logger.info("Auth middleware under api gateway middleware hits...");

  try {
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      logger.warn("Token is missing");
      return  res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn("Token is invalid");
        return res.status(429).json({
          success: false,
          message: "Token is invalid",
        });
      }
      logger.info("User authenticated", user);
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = authMiddleware;

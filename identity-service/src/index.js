const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { databaseConnection } = require("./db/dbConfig");
const logger = require("./utils/logger");
const Redis = require("ioredis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const globalErrorHandler = require("./middleware/errorHandler");

require("dotenv").config();
const PORT = process.env.PORT || 4231;
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());



app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${JSON.stringify(req.body)}`);
    next();
});

const redisClient = new Redis(process.env.REDIS_URL);


// for preventing Ddos and brute force attacks
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => next())
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
                success: false,
                message: "Too many requests"
            });
        })
});

//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,    // 15 minutes
    max: 50,                     // maximum no of req. it can do
    standardHeaders: true,       // whether to include rate limit header inside the response header or not and also this allows client to know how many requests are left for them to hit
    legacyHeaders: false,        // used to set/unset conventional(legacy) headers
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
});


//apply these senstive endpoints limiter to our routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", routes);


//Error Handler
app.use(globalErrorHandler);

databaseConnection()
    .then(response => {
        logger.info("database connection established");
        app.listen(PORT, () => logger.info(`Identity service running on port : ${PORT}`));
    })
    .catch(e => logger.error("error while establishing connection with database", e));


//unhandled promise
process.on("unhandledRejection", (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, "reason:", reason);
})
const express = require("express");
const Redis = require("ioredis");
const app = express();
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const globalErrorHandler = require("./middleware/errorHandler");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger");
require("dotenv").config();

const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

const rateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP :${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Too many requests"
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
});

app.use(cors());
app.use(helmet());


app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${JSON.stringify(req.body)}`);
    next();
});








app.use(globalErrorHandler);



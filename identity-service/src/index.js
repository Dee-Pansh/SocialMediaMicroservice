const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { databaseConnection } = require("../db/dbConfig");
const logger = require("../utils/logger");
const identityRouter = require("./routes/identity-service");
const Redis = require("ioredis");
import { RateLimiterRedis } from "rate-limiter-flexible";

require("dotenv").config();
const port = process.env.PORT || 4231;

app.use(helmet());
app.use(cors());
app.use(express.json());



app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
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
})

databaseConnection()
    .then(response => {
        logger.info("database connection established");
        app.listen(process.env.port, () => console.log(`Server is listening at port : ${port}`));
    })
    .catch(e => logger.error("error while establishing connection with database", e));
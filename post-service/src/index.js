const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const { databaseConnection } = require("./db/dbConfig");
const globalErrorHandler = require("./utils/errorHandler");
const logger = require("./utils/logger");
const postRouter = require("./routes/post-service");
const auth = require("./middleware/Auth");
const { connectToRabbitMQ } = require("./utils/rabbitmq");
require("dotenv").config();
const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

const rateLimitCommonSettings = {
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoints rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
};

const rateLimitForCreatePostApi = {
    windowMs: 10 * 60 * 1000,
    max: 25,
};

const rateLimitForGettingPosts = {
    windowMs: 10 * 60 * 1000,
    max: 25
};


const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const { password, token, ...safeBody } = req.body;
    logger.info(`Received ${req.method} request on ${req.url}`);
    logger.info(`Request body : ${JSON.stringify(safeBody)}`);
    next();
});




//ip based rate limiting on sensitive end points


app.use("/api/posts/create-post", rateLimit({
    ...rateLimitForCreatePostApi,
    ...rateLimitCommonSettings,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix:"create-post"
    })
}));

app.use("/api/posts/get-posts", rateLimit({
    ...rateLimitForGettingPosts,
    ...rateLimitCommonSettings,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix:"get-posts"
    })
}));

app.use("/api/posts/get-post", rateLimit({
    ...rateLimitForGettingPosts,
    ...rateLimitCommonSettings,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix:"get-post"
    })
}));


//routes
app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, auth, postRouter);


//Global Error Handler
app.use(globalErrorHandler);




redisClient.on("error", (err) => {
    logger.error("Redis connection error:", err);
    process.exit(1);
})


databaseConnection().then(async(response) => {
    logger.info("Database connected successfully");

    //connecting to rabbit mq server
    await connectToRabbitMQ();

    app.listen(PORT, () => {
        logger.info(`Post-service is listening on port ${PORT}`);
    })
}).catch(error => {
    logger.error("Database connection failed!", error.message);
});





//unhandled promise
process.on("unhandledRejection", (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, "reason:", reason);
})



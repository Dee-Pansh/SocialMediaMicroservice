const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const globalErrorHandler = require("./utils/errorHandler");
const databaseConnection = require("./db/dbConfig");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { AddPostEventHandler, DeletePostEventHandler } = require("./eventHandler/searchPostHandler");
const routes = require("./routes/search-routes");
const logger = require("./utils/logger");

require("dotenv").config();

const PORT = process.env.PORT || 3004;
const redisClient = new redis(process.env.REDIS_URL);

const rateLimitForSearch = {
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoints rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Too many requests"
        })
    }
}

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
    const { password, token, ...safeBody } = req.body;
    logger.info(`Received ${req.method} request on ${req.url}`);
    logger.info(`Request body : ${JSON.stringify(safeBody)}`);
    next();
});

// IP based rate limiting for sensitive endpoints
app.use("/api/search", rateLimit({
    ...rateLimitForSearch,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: "search-post"
    })
}));

//routes
app.use("/api/search", routes);


//database and rabbitMQ connections
databaseConnection().then(async (response) => {
    logger.info("Database connected successfully");
    app.listen(PORT, async () => {
        logger.info(`Search Service is running at PORT ${PORT}`);
    });
    await connectToRabbitMQ();
    await consumeEvent("post.created", AddPostEventHandler);
    await consumeEvent("post.deleted", DeletePostEventHandler);

});

//global error handler
app.use(globalErrorHandler);


process.on("unhandledRejection", (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, "reason:", reason);
})

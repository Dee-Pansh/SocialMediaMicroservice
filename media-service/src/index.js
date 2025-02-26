//imports
const express = require("express");
const logger = require("./utils/logger");
const helmet = require("helmet");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const databaseConnection = require("./db/dbConfig");
const cors = require("cors");
const routes = require("./routes/media-routes");
const globalErrorHandler = require("./utils/errorHandler");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");

//initialization
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3003;
const redisClient = new Redis(process.env.REDIS_URL);

//rate limit settings for upload file api
const rateLimitConfigForUploadFile = {
    windowMs: 10 * 60 * 1000,
    max: 25
};


//rate limit common settings for all Api's
const rateLimitCommonSettings = {
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoints rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Too many requests"
        });
    }
}



//pre defined middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());



// logging request info
app.use((req, res, next) => {
    const { password, token, ...safeBody } = req.body;
    logger.info(`Received ${req.method} method on ${req.url} \n request body : ${JSON.stringify(safeBody)}`);
    next();
});



//ip based rate limiting on sensitive end points
app.use("/api/media/upload", rateLimit({
    ...rateLimitConfigForUploadFile,
    ...rateLimitCommonSettings,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: "upload-media"
    })
}));


//routes
app.use("/api/media", routes);


//global error handler
app.use(globalErrorHandler);

console.log("media port : "+PORT);

//database connection
databaseConnection()
    .then(async (response) => {
        logger.info("Database Connection Established");

        //connecting to rabbit mq server
        const rabbitMQConnection = await connectToRabbitMQ();

        //consume all the events
        if (rabbitMQConnection)
            await consumeEvent("post.deleted", handlePostDeleted);
        else
            logger.error("Failed to connect to RabbitMQ, event comsumption not started");

        app.listen(PORT, () => logger.info(`Media service running on port : ${PORT}`));
    })
    .catch(e => logger.error("error while establishing connection with database", e));


//unhandled promise
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, Reason:`, reason instanceof Error ? reason.stack : JSON.stringify(reason));
});
const express = require("express");
const Redis = require("ioredis");
const app = express();
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const globalErrorHandler = require("./middleware/errorHandler");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger");
const proxy = require("express-http-proxy");
const validateToken = require("./middleware/authMiddleware");
require("dotenv").config();

const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

const RateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 60,
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

//proxy configurations
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error : ${err.message}`);
        res.status(500).json({
            message: "Internal Server Error", error: err.message
        });
    },
}

app.use(cors());
app.use(helmet());
app.use(express.json());


app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${JSON.stringify(req.body)}`);
    next();
});


//applying Rate Limit to our routes
app.use(RateLimit);


//proxy for "identity-service" microservice
app.use("/v1/auth", proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Identity service : ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));



//proxy for "post-service" microservice
app.use("/v1/posts", validateToken, proxy(process.env.POST_SERVICE_URL,
    {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

            proxyReqOpts.headers["Content-Type"] = "application/json";
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from Post service : ${proxyRes.statusCode}`);
            return proxyResData;
        }
    }));



//proxy for media-service microservice
app.use("/v1/media", validateToken, proxy(process.env.MEDIA_SERVICE_URL,
    {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

            if (!srcReq.headers["content-type"].startsWith("multipart/form-data"))
                proxyReqOpts.headers["Content-Type"] = "application/json";

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from Media service: ${proxyRes.statusCode}`);
            return proxyResData;
        },
        parseReqBody:false
    }));


    
//proxy for search-service microservice
app.use("/v1/search", validateToken, proxy(process.env.SEARCH_SERVICE_URL,
    {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

            if (!srcReq.headers["content-type"].startsWith("multipart/form-data"))
                proxyReqOpts.headers["Content-Type"] = "application/json";

            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from Search service: ${proxyRes.statusCode}`);
            return proxyResData;
        },
        parseReqBody:false
    }));



app.use(globalErrorHandler);


app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Post service is running on port ${process.env.POST_SERVICE_URL}`);
    logger.info(`Media service is running on port ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`Search service is running on port ${process.env.SEARCH_SERVICE_URL}`);
    logger.info(`Redis Url : ${process.env.REDIS_URL}`);
})


const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const Post = require("../models/Post");

const createPost = async (req, res) => {

    logger.info("Create post end point hits...");

    try {

        //validation
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.warn("Validation error ", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        //parsing request body
        const { content, mediaIds } = req.body;

        //creating new post
        const post = new Post({ user: req.user.userId, content, mediaIds: mediaIds || [] });


        //saving to database
        await post.save();

        logger.info("Post  created successfully", post);

        //sending success response to client
        res.status(201).json({
            success: true,
            message: "Post created and saved successfully"
        });

        logger.info("Post saved successfully to Database");

    } catch (error) {
        logger.error("Error creating post", error.message);
        res.status(400).json({
            success: false,
            message: "Error creating post"
        });
    }
};

const getAllPosts = async (req, res) => {
    logger.info("Getting all Posts end point hits...");
    try {

        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;

        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts)
            return res.json(JSON.parse(cachedPosts));

        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentpage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts
        };

        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.json(result);


    } catch (error) {
        logger.error("Error getting posts", error.message);
        res.status(400).json({
            success: false,
            message: "Error getting posts"
        });
    }
}

const getPost = async (req, res) => {
    logger.info("Getting Post By Id end point hits...");
    try {

    } catch (error) {
        logger.error("Error getting post", error.message);
        res.status(400).json({
            success: false,
            message: "Error getting post"
        });
    }
}

module.exports = { getAllPosts, getPost, createPost };


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


const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");
const {publishEvent} = require("../utils/rabbitmq");
const Post = require("../models/Post");

//for deleting the cached posts in redisDB
const invalidateCachedPosts = async (req, input) => {

    await req.redisClient.del(`post:${input}`);
    
    const cachedPosts = await req.redisClient.keys("posts:*");
    if (cachedPosts.length > 0)
        await req.redisClient.del(cachedPosts);

}

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
        const { content, mediaIDs } = req.body;

        //creating new post
        const post = new Post({ user: req.user.userId, content, mediaIDs: mediaIDs || [] });

        //saving to database
        await post.save();

        //publish create post method to rabbitMQ
        const result = await publishEvent("post.created",
            {
                postId:post._id.toString(),
                userId:req.user.userId,
                content,
                createdAt:post.createdAt
            }
        );

        await invalidateCachedPosts(req, post._id);

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
        logger.info("id from params : ", req.params.id);

        const postId = req.params.id;

        if (!postId)
            return res.status(400).json({
                message: "Post Id not provided",
                success: false
            });

        const cacheKey = `post:${postId}`
        const cachePost = await req.redisClient.get(cacheKey);

        if (cachePost)
            return res.json({ post: cachePost });

        const postById = await Post.findById(postId);

        if (!postById)
            return res.status(404).json({
                success: false,
                message: `No post is found with post id : ${postId}`
            });

        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(postById));

        res.json({
            success: true,
            message: {
                post: postById
            }
        });

    } catch (error) {
        logger.error("Error getting post", error.message);
        res.status(400).json({
            success: false,
            message: "Error getting post"
        });
    }
}

const deletePost = async (req, res) => {
    logger.info("Deleting end point hits...");
    try {
        logger.info("id from params : ", req.params.id);

        const postId = req.params.id;

        //validation
        if (!postId)
            return res.status(400).json({
                message: "Post Id not provided",
                success: false
            });

         //finding and deleting post from MongoDB database
        const deletedPost = await Post.findOneAndDelete({ _id: postId });
        if (!deletedPost)
            return res.status(404).json({
                success: false,
                message: `No post is found with post id : ${postId}`
            });


       //publish post delete method to rabbitMQ
       const result = await publishEvent("post.deleted",
        {
            postId:postId.toString(),
            userId:req.user.userId,
            mediaIDs:deletedPost.mediaIDs
        }
       );

       //removing cacheposts from redisDB
        await invalidateCachedPosts(req, req.params.id);


       //sending response to client
        res.json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        logger.error("Error deleting post", error.message);
        res.status(400).json({
            success: false,
            message: "Error getting post"
        });
    }
}




module.exports = { getAllPosts, getPost, createPost, deletePost };


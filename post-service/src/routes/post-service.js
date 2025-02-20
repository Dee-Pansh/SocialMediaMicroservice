const express = require("express");
const {createPost,getAllPosts,getPost} = require("../controllers/post-controller");
const postRouter = express.Router();

postRouter.post("/create-post",createPost);
postRouter.get("/get-posts",getAllPosts);
postRouter.get("/get-post",getPost);

module.exports = postRouter;
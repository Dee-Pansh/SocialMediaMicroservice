const express = require("express");
const {createPost,getAllPosts,getPost, deletePost} = require("../controllers/post-controller");
const postRouter = express.Router();

postRouter.post("/create-post",createPost);
postRouter.get("/get-all-posts",getAllPosts);
postRouter.get("/get-post/:id",getPost);
postRouter.delete("/delete-post/:id",deletePost);

module.exports = postRouter;
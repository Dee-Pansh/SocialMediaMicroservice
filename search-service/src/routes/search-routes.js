const express = require("express");
const { searchPost } = require("../controllers/searchController");
const authentication = require("../middleware/authentication");
const router = express.Router();

router.use(authentication);

router.get("/",searchPost);

module.exports = router;

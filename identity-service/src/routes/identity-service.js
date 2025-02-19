const express = require("express");
const { registerUser,signIn } = require("../controllers/identity-controller");
const router = express.Router();

router.post("/register", registerUser);
router.post("/signin",signIn)

module.exports = router;
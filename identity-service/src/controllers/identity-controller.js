const logger = require("logger");
const { validateRegisteration } = require("../utils/validation");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");


const registerUser = async (req, res) => {

    logger.info("Registeration endpoint hit...");

    try {
        // validate the schema
        const { error } = validateRegisteration(req.body);

        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        let user = await User.findOne({ $or: [{ email }, { password }, { username }] });

        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }
        
        const { email, username, password } = req.body;

        user = new User({ email, username, password });

        await user.save();

        logger.warn("User saved successfully", user._id);

        const { accessToken, refreshToken } = await generateToken(user);

        res.status(201).json(
            {
                success: true,
                message: "user registered successfully!",
                accessToken,
                refreshToken
            }
        );

    } catch (error) {
        logger.error("Registeration error occured", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } 
}

module.exports = { registerUser };
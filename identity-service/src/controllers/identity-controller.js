const logger = require("../utils/logger");
const { validateRegisteration, validateSignIn } = require("../utils/validation");
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

        const { email, username, password } = req.body;

        let user = await User.findOne({ $or: [{ email }, { password }, { username }] });

        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }



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

const signIn = async (req, res) => {
    logger.info("Sign in end point hits...");
    try {
        const { error } = validateSignIn(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            logger.warn("Invalid Credentials");
            res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        //check for valid password
        const passwordCheck = await existingUser.comparePassword(password);
        if (!passwordCheck) {
            logger.warn("Invalid Password");
            res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        };


        const { accessToken, refreshToken } = await generateToken(existingUser);

        logger.warn("User Authenticated", existingUser._id);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: existingUser._id
        });
        logger.info("User signed in", existingUser.username)


    } catch (error) {
        logger.error("SignIn error occured", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = { registerUser, signIn };
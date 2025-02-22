const logger = require("../utils/logger");
const { validateRegisteration, validateSignIn } = require("../utils/validation");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const RefreshToken = require("../models/RefreshToken");


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

const loginUser = async (req, res) => {
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
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        //check for valid password
        const passwordCheck = await existingUser.comparePassword(password);
        if (!passwordCheck) {
            logger.warn("Invalid Password");
            return res.status(401).json({
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
            message: "Internal Server Error"
        });
    }
}

const refreshTokenUser = async (req, res) => {

    try {
        logger.info("Refresh tokn end point hit...")

        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh Token missing");
            res.status(400).json({
                success: false,
                message: "Refresh Token missing"
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn("Token expired or invalid");
            res.status(404).json({
                success: false,
                message: "Token expired or invalid"
            })
        }

        const user = await User.findById({ _id: storedToken.user });

        if (!user) {
            logger.warn("User not found");
            res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user);

        //delete old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });


    } catch (error) {
        logger.error("Error occured while validating refresh token", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }



}

const logoutUser = async (req, res) => {
    try {
        logger.info("Logout end point hit...");

        const { refreshToken } = req.body;

        if (!refreshToken) {
            logger.warn("Refresh token is missing");
            res.status(400).json({
                success: false,
                message: "Refresh token is missing"
            })
        }

        //delete refresh token
        await RefreshToken.deleteOne({ token: refreshToken });

        logger.info("Refresh token deleted for logout");

        res.json({
            success: true,
            message: "Logged out successfully"
        });


    } catch (error) {
        logger.error("Error occured while logout", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }

}

module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
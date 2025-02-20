const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");

const generateToken = async (user) => {

    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username
    }, process.env.JWT_SECRET, { expiresIn: "60m" });

    const refreshToken = crypto.randomUUID();

    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from current date

    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    });

    return { accessToken, refreshToken };

}

module.exports = generateToken;
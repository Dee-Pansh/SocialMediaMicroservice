const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.methods.comparePassword = async function (inputPassword) {
    try {
        return await argon2.verify(this.password, inputPassword);
    } catch (error) {
        throw error;
    }
}

userSchema.pre("save", async function hashPassword(next) {
    if (this.isModified("password")) {
        try {
            this.password = await argon2.hash(this.password);
            next();
        }
        catch (error) {
            return next(error);
        }
    }
});



userSchema.index({ username: "text" });

const User = mongoose.model("User", userSchema);

module.exports = User;
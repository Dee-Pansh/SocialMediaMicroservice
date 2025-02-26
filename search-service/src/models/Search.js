const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    }
}, {
    timestamps: true
});

searchSchema.index({ content: "text" }, {
    createdAt: -1
});

const Search = mongoose.model("Search", searchSchema);

module.exports = Search;
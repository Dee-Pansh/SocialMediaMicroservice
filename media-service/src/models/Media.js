const mongoose = require("mongoose");

const mediaSchema = mongoose.Schema({
    publicId: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
});

const Media = new mongoose.model("Media", mediaSchema);

module.exports = Media;
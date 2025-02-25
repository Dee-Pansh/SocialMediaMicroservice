const logger = require("../utils/logger");
const Media = require("../models/Media");
const { removeMediaFromCloudinary } = require("../utils/cloudinary");

const handlePostDeleted = async (event) => {

    try {

        event = JSON.parse(event);

        logger.info("Media deletion process started for post", event.postId);

        console.log(typeof event);

        const postId = event.postId;
        const mediaIDs = event.mediaIDs;

        console.log("mediaIDs : "+mediaIDs);

        const allMedias = await Media.find({ _id: { $in: mediaIDs } });
        
        console.log(allMedias);

        for (let media of allMedias) {
            await removeMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);
        }

        logger.info("Media deletion process completed for post", postId);

    } catch (error) {
        logger.error("Errow while deleting media for post", event.postId);
        throw error;
    }

};
module.exports = { handlePostDeleted };
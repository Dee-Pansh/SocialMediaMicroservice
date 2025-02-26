const logger = require("../utils/logger");
const Search = require("../models/Search");

const AddPostEventHandler = async (event) => {

    try {
        logger.info("Adding post in Search Database");
        event = JSON.parse(event);

        const { postId, userId, content, createdAt } = event;

        const post = new Search({
            postId,
            userId,
            content,
            createdAt
        });

        const result = await post.save();

        logger.info("Post successfully added to Search Database");
    } catch (error) {
        logger.error(error);
        throw error;
    }

}


const DeletePostEventHandler = async (event) => {
    try {
        logger.info("Deletion of post process starts from Search Database");

        event = JSON.parse(event);

        const { postId } = event;

        await Search.findOneAndDelete({
            postId
        });

        logger.info("Post successfully deleted from Search Database");
    } catch (error) {
        logger.error(error);
        throw error;
    }
}


module.exports = { AddPostEventHandler, DeletePostEventHandler };
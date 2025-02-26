const logger = require("../utils/logger");
const Search = require("../models/Search");
const searchPost = async (req, res) => {
    logger.info("Search end point hits...");

    try {

        const { query } = req.query;

        if (!query || typeof query !== "string")
            return res.status(400).json({
                success: false,
                message: "Please send valid query"
            });

        const result = await Search.find(
            {
                $text: {
                    $search: query
                },
            },
            {
                score:
                {
                    $meta: "textScore"
                }
            }
        ).sort({ score: { $meta: "textScore" } }).limit(10);

        res.json({
            success: true,
            result
        });

    } catch (error) {
        res.status(500).json({
            message: false,
            error: error || "Internal server error"
        });
    }


}
module.exports = { searchPost };
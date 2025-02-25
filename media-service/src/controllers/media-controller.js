const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const Media = require("../models/Media");

const uploadMedia = async (req, res) => {

    logger.info("Media Uploading Controller hits...");

    try {
        if (!req.file) {
            logger.error("No file found. Please add a file and try again!");
            return res.status(400).json({
                success: false,
                message: "No file found, Please add a file and try again!"
            })
        };

        const { originalname, mimetype, buffer } = req.file;
        const userId = req.user.userId;

        logger.info(`File details : fileName ${originalname} filetype : ${mimetype}`);
        logger.info("Uploading to cloudinary starting...");

        const uploadResult = await uploadMediaToCloudinary(buffer);
        const { public_id, secure_url } = uploadResult;

        logger.info("File uploaded successfully to cloudinary. Public Id : ", public_id);

        const newlyCreatedMedia = new Media({
            publicId:public_id,
            originalName:originalname,
            mimeType:mimetype,
            url:secure_url,
            userId
        });

        await newlyCreatedMedia.save();
       
        res.status(201).json({
            success: true,
            url: secure_url,
            mediaId: public_id,
            message:"Media upload is successful"
        });


    } catch (error) {
        logger.error("Error while uploading media");
        res.status(500).json({
            success: false,
            message: error.message || "Error while uploading media"
        });
    }
}

const getAllMedias = async(req,res)=>{
  try {
    const results = await Media.find({});

    res.json({results});

    
  } catch (error) {
    logger.error("Error while getting media");
    res.status(500).json({
        success: false,
        message: error.message || "Error while getting media"
    });
  }
}

module.exports = { uploadMedia,getAllMedias };
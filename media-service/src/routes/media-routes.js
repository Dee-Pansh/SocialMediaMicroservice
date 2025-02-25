const express = require("express");
const multer = require("multer");
const AuthenticationRequest = require("../middleware/Auth");
const router = express.Router();
const { uploadMedia, getAllMedias } = require("../controllers/media-controller");
const logger = require("../utils/logger");

const upload = multer({
   storage: multer.memoryStorage(),
   limits: {
      fileSize: 5 * 1024 * 1024 // 5mb
   }
}).single("myFile");


router.post("/upload", AuthenticationRequest, (req, res, next) => {

   upload(req, res,
      function (err) {
         if (err instanceof multer.MulterError) {
            logger.error("Multer error while uploading file", err);
            return res.status(500).json({
               success: false,
               error: err.message || "Multer error while uploading file",
               stack: err.stack
            })
         }
         else if (err) {
            logger.error("Error while uploading file", err);
            return res.status(500).json({
               success: false,
               error: err.message || "Error while uploading file"
            })
         }

         if (!req.file) {
            logger.error("File not found!Please provide file");
            return res.status(400).json({
               success: false,
               message: "File not found!Please provide file"
            });
         }

         next();
      });

}, uploadMedia);

router.get("/get",AuthenticationRequest,getAllMedias);

module.exports = router;
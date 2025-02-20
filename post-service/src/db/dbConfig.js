require("dotenv").config();
const mongoose = require("mongoose");

const databaseConnection = async()=>{
   await mongoose.connect(process.env.MONGODB_URL);
}

module.exports = {databaseConnection};
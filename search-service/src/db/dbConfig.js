const mongoose = require("mongoose");
require("dotenv").config();

const databaseConnection = async () => {
    return await mongoose.connect(process.env.MONGODB_URL);
}

module.exports = databaseConnection;


// require("dotenv").config();
// const mongoose = require("mongoose");

// const databaseConnection = async()=>{
//    await mongoose.connect(process.env.MONGODB_URL);
// }

// module.exports = {databaseConnection};
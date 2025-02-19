const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
},
    {
        timestamps: true
    }
);


/*
Time to live index (TTL index) in MongoDB : autmat. deletes expired documents after specified amount of time 

Under the hood : we create TTL index on Date fleid, then mongoDB monitors this field and deletes docs once the time is reached.

expireAfterSeconds	                      Deletion                                       
     0	                       Deletes exactly when expiresAt is reached.
     1	                       Deletes 1 second after expiresAt.
    3600	                   Deletes 1 hour after expiresAt.

*/
refreshTokenSchema.index({ expiresAt: 1, expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;
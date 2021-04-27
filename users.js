const mongoose = require("mongoose");

const schema = {
    firstName: String,
    lastName: String,
};

module.exports = mongoose.model("users", new mongoose.Schema(schema));

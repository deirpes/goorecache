const mongoose = require('mongoose');
const goorecache = require('./src');
const User = require('./users');
goorecache(mongoose, "redis://127.0.0.1:6379");

mongoose.connect("mongodb://localhost/sample", { useNewUrlParser: true, useUnifiedTopology: true });

(async () => {
    User.find().cache(0).then(docs => console.log(docs));
})()

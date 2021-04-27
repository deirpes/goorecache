
const mongoose = require('mongoose');
const goorecache = require('./src');
goorecache(mongoose, "redis://127.0.0.1:6379");
const taster = require('./src');
taster.clearCache();

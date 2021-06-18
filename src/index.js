const Hash = require("mix-hash"),
    redis = require("redis"),
    util = require("util");

let client;

module.exports = function (mongoose, option) {
    const exec = mongoose.Query.prototype.exec;
    client = redis.createClient(option || "redis://127.0.0.1:6379");
    client.get = util.promisify(client.get);

    mongoose.Query.prototype.cache = function (ttl, customKey) {
        if (typeof ttl === 'string') {
            customKey = ttl;
            ttl = 60;
        }

        this._ttl = ttl;
        this._key = customKey;
        return this;
    }

    mongoose.Query.prototype.exec = async function () {
        if (typeof this._ttl === 'undefined') {
            return exec.apply(this, arguments);
        }
        const key = this._key || Hash.md5(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options, populates: JSON.stringify(this._mongooseOptions.populate) })));
        console.log(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options, populates: JSON.stringify(this._mongooseOptions.populate) })))

        const cached = await client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        const result = await exec.apply(this, arguments);
        if (result) {
            if (this._ttl <= 0) {
                client.set(key, JSON.stringify(result));
            } else {
                client.set(key, JSON.stringify(result), "EX", this._ttl);
            }
        }
        return result;
    }
};

module.exports.clearCache = function(customKey) {
    if (!customKey) {
        client.flushdb();
        return;
    }
    client.del(customKey);
};

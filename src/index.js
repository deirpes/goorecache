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
        const key = this._key || Hash.md5(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options })));

        const cached = await client.get(key);
        if (cached) {
            const doc = JSON.parse(cached);
            return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
        }

        const result = await exec.apply(this, arguments);
        if (result) {
            if (!this._ttl || this._ttl <= 0) {
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

"use strict";

var _ = require('lodash');
var redis = require("redis");
var queue = "scraper_queue";

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));

var add = function(url) {
    var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);
    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.rpush(queue, url, redis.print);
    client.quit();

};

var get = function(cb) {
    var client = redis.createClient();
    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.lrange(queue, -1000, 1000, function(err, replies) {
        console.log(replies);
        console.log(replies.length);
        console.log(replies[0]);

        var url = _.sample(replies);

        client.lrem(queue, -100, url);

        client.quit();


        cb(url);
    });

};

var peek = function() {
    var client = redis.createClient();
    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.lrange(queue, -1000, 1000, function(err, replies) {
        console.log("*****", replies.length);
        console.log(replies);

        client.quit();
    });
};

var mark = function(u) {
    var client = redis.createClient();
    client.set(u, "1");
};

var runOnce = function(u, cb) {
    var client = redis.createClient();
    client.get(u, function(err, reply) {
        // reply is null when the key is missing
        if ( reply === null ) {
            //client.set(u, "1");
            cb();
        }
    });
};


exports.add = add;
exports.get = get;
exports.mark = mark;
exports.runOnce = runOnce;

exports.peek = peek;

"use strict";

var _ = require('lodash');
var redis = require("redis");

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));

var queue = "scraper_queue";
var push_check = "push_check";

var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);
client.on("error", function (err) {
    console.log("Error " + err);
});

var addOnce = function(url) {
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    console.log(url);

    // only add to the queue if we haven't already added it
    client.hget(push_check, url, function(err, reply) {
        // reply is null when the key is missing
        if ( reply === null ) {
            console.log("push " + url);
            client.hset(push_check, url, "1");
            client.rpush(queue, url, redis.print);
        }
    });
};

var add = function(urls, do_quit) {
    if ( typeof(urls) === "string" ) {
        urls = [ urls ];
    }
    for ( var i = 0; i < urls.length; i++ ) {
        addOnce(urls[i], do_quit);
    }
};

var get = function(cb) {
    client.lrange(queue, 0, 1000, function(err, replies) {
        var url = _.sample(replies);
        client.lrem(queue, 0, url);
        cb(url);
    });
};

var peek = function() {
    client.lrange(queue, 0, 1000, function(err, replies) {
        console.log(replies);
        console.log("*****", replies.length);
    });
};

var mark = function(u) {
    client.set(u, "1");
};

var runOnce = function(u, cb) {
    client.get(u, function(err, reply) {
        // reply is null when the key is missing
        if ( reply === null ) {
            client.set(u, "1");
            cb();
        }
    });
};


var quit = function() {
    client.quit();
};

exports.add = add;
exports.get = get;
exports.mark = mark;
exports.runOnce = runOnce;

exports.peek = peek;
exports.quit = quit;
exports.client = client;
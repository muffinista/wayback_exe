"use strict";

var _ = require('lodash');
var redis = require("redis");
var queue = "scraper_queue";
<<<<<<< HEAD
var push_check = "push_check";
=======
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));

<<<<<<< HEAD
var addOnce = function(url) {
=======
var add = function(url) {
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
    var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);
    client.on("error", function (err) {
        console.log("Error " + err);
    });
<<<<<<< HEAD
    console.log(url);

    // only add to the queue if we haven't already added it
    client.hget(push_check, url, function(err, reply) {
        // reply is null when the key is missing
        if ( reply === null ) {
            console.log("push " + url);
            client.hset(push_check, url, "1");
            client.rpush(queue, url, function() {
                client.quit();
            });
        }
        else {
            console.log("already added " + url + ", skipping");
            client.quit();
        }
    });
};

var add = function(urls) {
    var url;

    if ( typeof(urls) === "string" ) {
        urls = [ urls ];
    }

    console.log("here with some urls");

    for ( var i = 0; i < urls.length; i++ ) {
        addOnce(urls[i]);
    }
};

var get = function(cb) {
    var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);   
=======

    client.rpush(queue, url, redis.print);
    client.quit();

};

var get = function(cb) {
    var client = redis.createClient();
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
    client.on("error", function (err) {
        console.log("Error " + err);
    });

<<<<<<< HEAD
    client.lrange(queue, 0, 1000, function(err, replies) {
=======
    client.lrange(queue, -1000, 1000, function(err, replies) {
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
        //console.log(replies);
        //console.log(replies.length);
        //console.log(replies[0]);

        var url = _.sample(replies);

        client.lrem(queue, 0, url);

        client.quit();

<<<<<<< HEAD
=======

>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
        cb(url);
    });

};

var peek = function() {
<<<<<<< HEAD
    var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);
=======
    var client = redis.createClient();
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
    client.on("error", function (err) {
        console.log("Error " + err);
    });

<<<<<<< HEAD
    client.lrange(queue, 0, 1000, function(err, replies) {
=======
    client.lrange(queue, -1000, 1000, function(err, replies) {
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
        console.log(replies);
        console.log("*****", replies.length);

        client.quit();
    });
};

var mark = function(u) {
<<<<<<< HEAD
    var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);
=======
    var client = redis.createClient();
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
    client.set(u, "1");
};

var runOnce = function(u, cb) {
<<<<<<< HEAD
    var client = redis.createClient(conf.redis.port, conf.redis.host, conf.redis.password);
    client.get(u, function(err, reply) {
        // reply is null when the key is missing
        if ( reply === null ) {
            client.set(u, "1");
=======
    var client = redis.createClient();
    client.get(u, function(err, reply) {
        // reply is null when the key is missing
        if ( reply === null ) {
            //client.set(u, "1");
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
            cb();
        }
    });
};


exports.add = add;
exports.get = get;
exports.mark = mark;
exports.runOnce = runOnce;

exports.peek = peek;

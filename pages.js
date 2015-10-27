"use strict";
var mysql = require('mysql');

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));

/**
 * add a page to the database
 */
var add = function(opts) {
    var connection = mysql.createConnection(conf.mysql);

    console.log("store: " + opts.url);
    connection.query(
        {
            sql:'SELECT COUNT(*) AS tally FROM pages WHERE url = ?', 
            values: [opts.url]
        },
        function(err, rows, fields) {
            if (err) throw err;
            
            if ( rows[0].tally > 0 ) {
                console.log("looks like " + opts.url + "is already in the db");
                connection.end(function(err) {
                    //console.log("mysql connection closed: " + err);
                });

            }
            else {
                connection.query("INSERT INTO pages SET ?", {
                    url: opts.url,
                    score: opts.score,
                    title: opts.title,
                    tstamp: opts.tstamp,
                    generator: opts.generator,
                    content: opts.content,
                    host: opts.host,
                    created_at: new Date()
                }, function(err, result) {
                    console.log(err);
                    console.log(result);
                });

                connection.end(function(err) {
                    //console.log("mysql connection closed: " + err);
                });               
            }
        });
};

/**
 * Pick a random page from the database, and mark is as posted so we only render it at once.
 * Using RAND() here is pretty awful but performance isn't much of an issue.
 */
var getAndMarkRandom = function(cb) {
    var connection = mysql.createConnection(conf.mysql);
    connection.query(
        {
            sql:'SELECT * FROM pages WHERE posted_at IS NULL ORDER BY RAND() LIMIT 1'
        },
        function(err, rows, fields) {
            if (err) throw err;
            var result = rows[0];
            console.log(result);
            connection.query("UPDATE pages SET posted_at = NOW() WHERE id = " + result.id,
                             function(err, result) {
                                 console.log(err);
                                 console.log(result);
                             });

            connection.end(function(err) {
            });
            
            cb(result);
        });

};


exports.add = add;
exports.getAndMarkRandom = getAndMarkRandom;

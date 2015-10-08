"use strict";
var mysql = require('mysql');

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));

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
                    console.log("mysql connection closed: " + err);
                });

            }
            else {
                connection.query("INSERT INTO pages SET ?", {
                    url: opts.url,
                    score: opts.score,
                    created_at: new Date()
                }, function(err, result) {
                    console.log(err);
                    console.log(result);
                });

                connection.end(function(err) {
                    console.log("mysql connection closed: " + err);
                });               
            }
        });


};

exports.add = add;
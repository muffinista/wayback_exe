"use strict";
var mysql = require('mysql');
var fs = require('fs');

var conf = JSON.parse(fs.readFileSync('conf.json'));

var add = function(opts) {
    var connection = mysql.createConnection(conf.mysql);

    connection.query("INSERT INTO pages SET ?", {
        url: opts.url,
        score: opts.score,
        created_at: new Date()
    }, function(err, result) {
        console.log(err);
        console.log(result);
    });
};

exports.add = add;
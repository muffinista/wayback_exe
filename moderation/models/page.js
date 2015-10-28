var mysql = require('mysql');
var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('../conf.json'));

var pool = mysql.createPool(conf.mysql);

exports.getPages = function(opts, cb) {
    pool.getConnection(function(err, conn) {
        conn.query("SELECT id, url, tstamp, title FROM pages WHERE approved_at IS NULL AND posted_at IS NULL limit 1000", cb);
    });
};

exports.get = function(opts, cb) {
    pool.getConnection(function(err, conn) {
        conn.query("SELECT * FROM pages WHERE id = ?", [opts.id], function(err, results) {
            cb(results[0]);
        });
    });
};

exports.approve = function(opts, cb) {
    pool.getConnection(function(err, conn) {
        conn.query("UPDATE pages SET approved_at = NOW() WHERE id = ?", [opts.id], function(err, results) {
            cb();
        });
    });
};


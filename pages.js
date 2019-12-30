"use strict";
var mysql = require('mysql');

var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));
var lodash = require('lodash');

var pool = mysql.createPool(conf.mysql);

/**
* add a page to the database
*/
var add = function(opts) {
  pool.getConnection(function(err, connection) {
    //console.log("store: " + opts.url);
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
            created_at: new Date(),
            approved_at: opts.approved_at
          }, function(err, result) {
            //console.log(err);
            //console.log(result);
          });
          
        }
      });
    });
  };
  
  /**
  * Pick a random page from the database, and mark is as posted so we only render it at once.
  * Using RAND() here is pretty awful but performance isn't much of an issue.
  */
  var getAndMarkRandom = function(cb) {
    pool.getConnection(function(err, connection) {
      connection.query(
        "SELECT host FROM pages WHERE posted_at IS NOT NULL ORDER by posted_at DESC LIMIT 50", 
        function(err, rows, fields) {
          var hosts = lodash.map(rows, function(x) { return x.host; });
          
          // tired of posts from this forum showing up all the time
          hosts.push("forums.nj.com");
          hosts.push("www.nj.com");
          //  SELECT id FROM pages WHERE posted_at IS NULL AND approved_at IS NOT NULL and host not in ('yahoo.com') order by random_key limit 1;
          var q = "SELECT * FROM pages WHERE posted_at IS NULL AND approved_at IS NOT NULL AND host NOT IN (?) ORDER BY random_key LIMIT 1"
          //                var q = "SELECT * FROM pages WHERE posted_at IS NULL AND approved_at IS NOT NULL AND host NOT IN (?) ORDER BY RAND() LIMIT 1";
          
          connection.query({ sql:q, values: [ hosts ] },
            function(err, rows, fields) {
              if (err) throw err;
              var result = rows[0];
              
              // execute callback now before marked as posted
              // so that if something goes wrong, we preserve the page
              cb(result);
              
              //console.log(result);
              connection.query("UPDATE pages SET posted_at = NOW() WHERE id = " + result.id,
              function(err, result) {
                console.log(err);
                console.log(result);
              });
              
              
            });
            
          });
        });
        
      };
      
      var close = function() {
        console.log("closing mysql pool!");
        pool.end(function (err) {
          // all connections in the pool have ended
          console.log("MySQL pool closed");
        });
      };
      
      exports.add = add;
      exports.getAndMarkRandom = getAndMarkRandom;
      exports.close = close;
      
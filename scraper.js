"use strict";

var _ = require('lodash');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');

var queue = require('./queue.js');

//var domains = JSON.parse(fs.readFileSync('sources.json'));
//console.log(domains);

//var base_url = _.sample(domains); //"tandy.com";
//var match = _.sample(["prefix", "exact", "exact"]);

/**
 * this returns URLS from the wayback machine archive which match the incoming URL
 */
var findMatchingUrls = function(url, cb) {
    var match = "domain";
    var from = "19950101";
    var to = "19970101";

    var scrape_url = "https://web.archive.org/cdx/search/cdx?output=json&url=" + url +
            "&filter=statuscode:200&filter=mimetype:text/html" +
            //        "&collapse=timestamp:6" +
            "&limit=100" +
            "&matchType=" + match +
            "&from=" + from +
            "&to=" + to;
    console.log("LETS FIND URLS MATCHING " + url);


    console.log(scrape_url);
    request(scrape_url, function (error, response, body) {
        console.log(body);
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var keys = data.shift();

            var objects = _.select(
                _.map(data, function(x) {
                    return _.object(keys, x);        
                }),
                function(obj) {
                    // strip out front page extension data
                    //console.log(obj.original);
                    return ( obj.original.indexOf('_vti') === -1 );
                }
            );

            console.log(objects);

            cb(objects);
        }
    });
};

var scrapeUrl = function(url, timestamp, cb) {
    var target = "http://web.archive.org/web/" + timestamp + "/" + url;
    console.log(target);
    request(target, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            console.log("got response, send it along");
            cb(body);
        }
    });
};

var parseAndClean = function(contents) {
    var $ = cheerio.load(contents);
    $("#wm-ipp").remove();
    return $;
};

var urlsToScrape = function(contents) {
    var $ = parseAndClean(contents);
    var re = /\/web\/[\d]+\//;
    return _.select(
        $('body').find("a").map(function(i, a) {
            // grab the href from any links. the replace here should strip /web/timestamp/
            //var timestamp = a.attribs.href.match(re)[0];
            var href = a.attribs.href.replace(re, "");
            //console.log(timestamp, href);
            return href;
        }),
        function(url) {
            return typeof(url) !== "undefined" && url.indexOf('http') !== -1 && url.indexOf('_vti') === -1 && url.length > 1;
        });
};

var dataToUrl = function(obj) {
  // [["urlkey","timestamp","original","mimetype","statuscode","digest","length"],
  // ["edu,rpi)/about/faq/home_page.html", "19990420100910", "http://www.rpi.edu:80/About/FAQ/home_page.html", "text/html", "200", "C4S2ZVJ2W4L72FLRSMEC2HSGRPP43YVL", "2081"],
    
  return "http://web.archive.org/web/" + obj.timestamp + "/" + obj.original;
};

//var url = "http://archive.org/wayback/available?url=amazon.com&timestamp=19950101";

var default_timestamp = "19950101";

var validPage = function(c) {
    return c.indexOf('<p class="code">Redirecting to...</p>') === -1 &&
        c.indexOf('<p>Wayback Machine doesn&apos;t have that page archived.</p>') === -1;
};

var min_score = 0;

var score = function(body) {
    return 1;
};

var scrape = function(u) {
    console.log("lets scrape", u);

    if ( typeof(u) === "undefined" ) {
        console.log("nothing to scrape!");
        return;
    }

    queue.runOnce(u, function() {
        scrapeUrl(u, default_timestamp, function(body) {
            //queue.mark(u);

            if ( ! validPage(body) ) {
                console.log("looks like " + u + "didn't return a 200, bye");
                return;
            }

            if ( score(body) > min_score ) {
                var urls = urlsToScrape(body);
                console.log(urls);
                queue.add(urls);
            }
        });
    });
};

var run = function() {
    var q = require('./queue.js');
    q.get(function(url) {
        scrape(url);
    });
};


exports.findMatchingUrls = findMatchingUrls;
exports.scrapeUrl = scrapeUrl;
exports.urlsToScrape = urlsToScrape;
exports.scrape = scrape;
exports.run = run;
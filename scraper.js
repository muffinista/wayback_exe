"use strict";

var _ = require('lodash');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');

var queue = require('./queue.js');
var url = require('url');

var re = /\/web\/[\d]+\//;
var default_timestamp = "19950101";
var min_score = 0;
var max_year = 1998;

var createIsCool = require('iscool');
var isCool = createIsCool();

var pages = require('./pages.js');


var scrapeUrl = function(url, timestamp, cb) {
    var target = "http://web.archive.org/web/" + timestamp + "/" + url;
    console.log(target);
    request(target, function (error, response, body) {
        if ( error || response.statusCode !== 200 ) {
            console.log(error);
        }

        // make sure there was no error, that this was a 200 response, and that it's text-ish
        if (!error && response.statusCode == 200 && response.headers['content-type'].indexOf("text/") !== -1 ) {
            //console.log(body);
            console.log("got valid response, send it along");
            cb(body, response.request.href);
        }
    });
};

var parseAndClean = function(contents) {
    var $ = cheerio.load(contents);
    $("#wm-ipp").remove();
    return $;
};

var getPageAttrs = function(contents) {
    var $ = parseAndClean(contents);
    var attrs = {
        title: $("title").text(),
        generator: ""
    };

    var m = $('meta[name="generator"]').get(0);

    if ( typeof(m) !== "undefined" ) {
        attrs.generator = m.attribs.content;
    }

    return attrs;
};




var urlsToScrape = function(contents, u) {
    var $ = parseAndClean(contents);
    if ( typeof(u) == "undefined" ) {
        u = "";
    }

    return _.uniq(
        _.select(
            $('body').find("a").map(function(i, a) {
                // grab the href from any links. the replace here should strip /web/timestamp/
                var href;
                if ( a.attribs && a.attribs.href ) {
                    href = a.attribs.href.replace(re, "");
                    try {
                        href = url.resolve(u, href);
                    }
                    catch(e) {
                        console.log("URL error: " + href);
                        console.log(e);
                        href = undefined;
                    }
                }
                else {
                    href = undefined;
                }
                
                return href;
            }),
            function(url) {
                return typeof(url) !== "undefined" &&
                    url.indexOf('http') !== -1 && 
                    url.indexOf('_vti') === -1 && 
                    url.indexOf("yahoo.com/Regional/") === -1 &&
                    url.indexOf("yahoo.com/bin") === -1 &&
                    url.indexOf("yahoo.com/SpaceID") === -1 &&
                    url.length > 1;
            })
    );
};


var invalidPage = function(c) {
    return c.indexOf('<p class="code">Redirecting to...</p>') > -1 ||
        c.indexOf('<p>Wayback Machine doesn&apos;t have that page archived.</p>') > -1 ||
        c.indexOf('HTTP-EQUIV="REFRESH"') > -1;
};

var findRedirect = function(c) {
    var result = undefined;

    var $ = cheerio.load(c);

    var meta = $("meta[http-equiv]");
    if ( c.indexOf('<p class="code">Redirecting to...</p>') > 0 ) {
        result = $(".impatient a").get(0).attribs.href;
        result = result.replace(re, "");
    }
    else if ( meta.length > 0 ) {
        console.log("**** " + meta.get(0).attribs.content);
        console.log("**** " + meta.get(0).attribs.content.split(/; *url=/i)[1]);
        result =  meta.get(0).attribs.content.split(/; *url=/i);
        if ( typeof(result) === 'object' && result.length > 1 ) {
            var dest = result[1].replace(re, "");
            return dest;
        }
        result = undefined; // tmp hack
    }

    return result;
};



var score = function(url, body) {

    // Scraper scoring
    // Number of buzzwords
    // Number of images
    // Number of tags
    var $ = cheerio.load(body);    
    var tags = $("*").length;
    var images = $("img").length;
    var tildes = (url.indexOf("~") !== -1) ? 100 : 0;

    console.log("tags: " + tags + " images: " + images + " tildes: " + tildes);

    return tags + images + tildes;
};

var scrape = function(u) {
    console.log("lets scrape", u);

    if ( typeof(u) === "undefined" ) {
        console.log("nothing to scrape!");
        return;
    }

    queue.runOnce(u, function() {
        scrapeUrl(u, default_timestamp, function(body, url) {
            //queue.mark(u);

            console.log("actual url: " + url);
            var tstamp = url.split('/')[4];
            var year = parseInt(tstamp.substr(0, 4), 10);
            console.log("YEAR: " + year);
            if ( year > max_year ) {
                console.log("oops, this page is from " + year);
                return;
            }

            if ( invalidPage(body) ) {
                console.log("looks like " + u + " didn't return a 200, bye");
                var r = findRedirect(body);
                if ( typeof(r) !== "undefined" ) {
                    console.log("let's scrape redirect " + r + " at some point");
                    queue.add([r]);
                }

                return;
            }
            
            var page_score = score(u, body);            
            if ( isCool(body) && page_score > min_score ) {
                //console.log("score: " + page_score + " looks good, let's store it");
                var urls = urlsToScrape(body, u);

                //console.log(urls);

                if ( urls.length > 0 ) {
                    queue.add(urls);
                }
                else {
                    console.log("ADD " + urls.length);
                }

                var attrs = getPageAttrs(body);

                pages.add({
                    url: u,
                    body: body,
                    score: page_score,
                    tstamp: tstamp,
                    title: attrs.title,
                    generator: attrs.generator
                });
            }
            else {
                console.log("this page wasn't cool enough, sorry :(");
            }
        });
    });
};

var run = function() {
    var q = require('./queue.js');
    q.get(function(url) {
        try {
            scrape(url);
        }
        catch(e) {
            console.log(";(", e);
        }
    });
};

var loop = function() {
    console.log("ok, running forever!");
    var q = require('./queue.js');
    setInterval(function() {
        run();
    }, 10000);
};


exports.scrapeUrl = scrapeUrl;
exports.urlsToScrape = urlsToScrape;
exports.scrape = scrape;
exports.run = run;
exports.loop = loop;
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

var pages = require('./pages.js');

var wordfilter = require('wordfilter');


/**
 * run without checking if a page has aleady been scraped
 */
var alwaysRun = function(val) {
    queue.alwaysRun(val);
};


/**
 * load a single URL from the wayback machine at the specified timestamp,
 *  make sure it was relatively valid, then pass to callbacka
 */
var scrapeUrl = function(url, timestamp, cb, onError) {
    var target = "http://web.archive.org/web/" + timestamp + "/" + url;
    console.log(target);
    request(target, function (error, response, body) {
        if ( error || response.statusCode !== 200 ) {
            console.log("ERR: " + error);
            console.log("response: " + response); 

            if ( typeof(onError) !== "undefined" ) {
                onError(error, response);
            }
        }

        // make sure there was no error, that this was a 200 response, and that it's HTML-ish
        if (!error && response.statusCode == 200 && response.headers['content-type'].indexOf("text/html") !== -1 ) {
            console.log("got valid response, send it along");
            cb(body, response.request.href);
        }
    });
};

/**
 * remove the wayback header from the output so we don't include it in parsing
 */
var parseAndClean = function(contents) {
    var $ = cheerio.load(contents);
    $("#wm-ipp").remove();
    return $;
};

/**
 * parse out some page attributes for storing later
 */
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



/**
 * find a list of URLs on the page, remove the wayback prefixes, and return
 */
var urlsToScrape = function(contents, u) {
    var $ = parseAndClean(contents);
    if ( typeof(u) == "undefined" ) {
        u = "";
    }

    return _.uniq(
        _.select(
            $('body').find("a").map(function(i, a) {
                // grab the href from any links. the replace here should strip /web/timestamp/
                var href = undefined;
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
                return href;
            }),
            function(url) {
                // strip out some obviously junky URLs
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

/**
 * do a couple basic tests to make sure this is a page we might want to render/store. basically
 * make sure it's a 200 and doesn't have an old meta-refresh on it
 */
var invalidPage = function(c) {
    return c.indexOf('<p class="code">Redirecting to...</p>') > -1 ||
        c.indexOf('<p>Wayback Machine doesn&apos;t have that page archived.</p>') > -1 ||
        c.indexOf('HTTP-EQUIV="REFRESH"') > -1 ||
        c.indexOf('frameset') > -1;
};

/**
 * look for a potential redirect url on this page
 */
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



/**
 * generate a fairly arbitrary 'score' for the page. Not really used right now
 */
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

/**
 * scrape the specified URL
 */
var scrape = function(u) {
    console.log("lets scrape", u);

    if ( typeof(u) === "undefined" ) {
        console.log("nothing to scrape!");
        return;
    }

    queue.runOnce(u, function() {
        scrapeUrl(u, default_timestamp, function(body, _url) {
            console.log("actual url: " + _url);
            var tstamp = _url.split('/')[4];
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
            var attrs = getPageAttrs(body);

            if ( page_score > min_score ) {
                //console.log("score: " + page_score + " looks good, let's store it");
                var urls = urlsToScrape(body, u);

                if ( urls.length > 0 ) {
                    queue.add(urls);
                }

                //
                // we'll auto-approve pages that don't have bad words on them
                // and don't have long strings of numbers (phone numbers, etc)
                //

                var approved_at;

                var $ = cheerio.load(body.replace(/</g, ' <'));
                var test_text = $("body").first().text().replace(/ +/g, " ");

                if ( test_text.match(/[\(\+]?\b[ 0-9\-\(\)+^'^"^<^>]{10,14}\b/g) === null &&
                     ! wordfilter.blacklisted(test_text) ) {
                    approved_at = new Date();
                }

		            if ( u.indexOf("yahoo.com") === -1 ) {
                    var h = url.parse(u).host;
                    pages.add({
			                  url: u,
                        host: h,
			                  body: body,
			                  score: page_score,
			                  tstamp: tstamp,
			                  title: attrs.title,
			                  generator: attrs.generator,
                        content: body,
                        approved_at: approved_at
                    });
		            }
		            else {
		                console.log("we will scrape yahoo pages but not store them in mysql");
		            }
            }
            else {
                console.log("this page wasn't cool enough, sorry :(");
            }
        });
    });
};

/**
 * grab a url from the queue and scrape it
 */
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

/**
 * main loop. run forever!
 */
var loop = function() {
    console.log("ok, running forever!");
    var q = require('./queue.js');
    setInterval(function() {
        run();
    }, 10000);
};


exports.alwaysRun = alwaysRun;
exports.scrapeUrl = scrapeUrl;
exports.urlsToScrape = urlsToScrape;
exports.scrape = scrape;
exports.run = run;
exports.loop = loop;

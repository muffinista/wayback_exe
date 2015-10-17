var _ = require('lodash');
var phantom = require('phantom');
var fs = require('fs');
var cheerio = require('cheerio');
var moment = require('moment');

var Twit = require('twit');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var T = new Twit(conf.twitter);

var Tumblr = require('tumblrwks');

var pages = require('./pages.js');

// default viewport options for phantom. we will tweak these to match
// the browser frame that we will fit the page into. NOTE: phantom is
// a mess and probably doesn't enjoy rendering pages from 1998 either
var viewportOpts = {
    width: 800,
    height: 600
};

var phantomActions = function() {
    // trigger in-page js to close wayback machine nav
    __wm.h();
};

// send the page to twitter
var tweetPage = function(url, p, dest, cb) {
    var title = p.title;
    if ( title.length > 80 ) {
        title = title.substr(0, 76) + "...";
    }
    var date = moment(p.tstamp, "YYYYMMDDHHmmss").format("MMM YYYY");
    
    var tweetText = title + "\n" + date + "\n";
    if ( typeof(p.generator) !== "undefined" &&
         p.generator !== "" &&
         tweetText.length + p.generator.length < 118 )
    {
        tweetText = tweetText + p.generator + "\n";
    }
    
    tweetText = tweetText + url;

    var imgContent = fs.readFileSync(dest, { encoding: 'base64' });

    T.post('media/upload', { media_data: imgContent }, function (err, data, response) {
                        
        // now we can reference the media and post a tweet (media will attach to the tweet) 
        var mediaIdStr = data.media_id_string;
        var params = {
            status: tweetText,
            media_ids: [ mediaIdStr ]
        };
                            
        console.log(params);
                            
        T.post('statuses/update', params, function (err, data, response) {
            //console.log(data);
            console.log("done!");
            console.log(err);
            cb();
        }); // status/update
    }); // media/upload

};

// send the page to tumblr
var postPage = function(url, p, dest, cb) {
    var tumblr = new Tumblr(conf.tumblr, conf.tumblr_url);

    var title = p.title;
    var date = moment(p.tstamp, "YYYYMMDDHHmmss").format("MMM YYYY");
    
    var caption = title + "\n" + date + "\n";
    if ( typeof(p.generator) !== "undefined" && p.generator !== "")   {
        caption = caption + p.generator + "\n";
    }

    var imgContent = fs.readFileSync(dest, { encoding: 'base64' });
    tumblr.post('/post', {
        type: 'photo', 
        link: url,
        caption: caption,
        data64: imgContent
    }, function(err, json){
        console.log(err);
        console.log(json);
    });
};

// main action. load page in phantom and send off to assorted
// tweeting/tumblring routines
var renderPage = function(p) {
    var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
    console.log(url);
    
    var frames = JSON.parse(fs.readFileSync('frames.json'));
    var frame = _.sample(frames);
    console.log(frame);

    phantom.create(function (ph) {
        ph.createPage(function (page) {                       
            page.open(url, function (status) {
                console.log("status? ", status);

                // set the size of the browser to be the size of the interior of the frame
                viewportOpts.width = frame.w;
                viewportOpts.height = frame.h;

                page.set('viewportSize', viewportOpts);
                page.set('clipRect', viewportOpts);

                page.evaluate(phantomActions, function() {

                    page.render('page.png', function() {
                        var exec = require('child_process').execFileSync;
                        var dest = 'tmp.png';
                        var command = ['page.png', 'images/' + frame.name, '-geometry',
                                       '+' + frame.x + '+' + frame.y, dest];
                        console.log(command.join(' '));

                        exec('composite', command);
                        tweetPage(url, p, dest,
                                  function() { 
                                      postPage(url, p, dest); 
                                      ph.exit();
                                  });
                       
                    }); // render
                }); // evaluate
            }); // open

        });
              
    }, {
        dnodeOpts: {weak: false}
    });

};

pages.getAndMarkRandom(renderPage);

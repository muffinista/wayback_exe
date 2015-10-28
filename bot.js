var _ = require('lodash');
var fs = require('fs');
var cheerio = require('cheerio');
var moment = require('moment');

var Twit = require('twit');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var T = new Twit(conf.twitter);

var Tumblr = require('tumblrwks');


var pages = require('./pages.js');
var renderer = require('./renderer.js');


// send the page to twitter
var tweetPage = function(p, dest, cb) {
    var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
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
var postPage = function(p, dest, cb) {
    var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
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


var renderPage = function(p) {
    // hacky fun to pass along an option which will wrap the output in a frame
    p.wrap = true;

    renderer.render(p, function(dest) {
        tweetPage(p, dest,
                  function() { 
                      postPage(p, dest); 
                  });
    });
};

pages.getAndMarkRandom(renderPage);

/**
 renderPage(
    { id: 1318,
      url: 'http://www.hiway.com/',
      tstamp: '19961222133514',
      title: 'Systems',
      generator: '',
      score: 84,
      created_at: "Wed Oct 14 2015 22:24:43 GMT+0000 (UTC)",
      posted_at: null 
    },
    true);
*/
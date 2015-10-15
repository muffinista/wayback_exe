var _ = require('lodash');
var phantom = require('phantom');
var fs = require('fs');
var cheerio = require('cheerio');
var moment = require('moment');

var Twit = require('twit');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var T = new Twit(conf.twitter);

var pages = require('./pages.js');

var viewportOpts = {
    width: 800,
    height: 600
};

var phantomActions = function() {
    // close wayback machine nav
    __wm.h();
};

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

                    var title = p.title;
                    if ( title.length > 80 ) {
                        title = title.substr(0, 76) + "...";
                    }
                    var date = moment(p.tstamp, "YYYYMMDDHHmmss").format("MMM YYYY");

                    var tweetText = title + "\n" + date + "\n";
                    if ( typeof(p.generator) !== "undefined" && 
                         p !== "" && 
                         tweetText.length + p.generator.length < 118 ) 
                    {
                        tweetText = tweetText + p.generator + "\n";
                    }


                    tweetText = tweetText + url;

                    page.render('page.png', function() {
                        var exec = require('child_process').execFileSync;
                        var command = [
                            'page.png',
                            'images/' + frame.name,
                            '-geometry', '+' + frame.x + '+' + frame.y,
                            'tmp.png'];
                        console.log(command.join(' '));

                        exec('composite', command);

                        var imgContent = fs.readFileSync('tmp.png', { encoding: 'base64' });

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
                                ph.exit();
                            }); // status/update
                        }); // media/upload
                        
                    }); // render
                }); // evaluate
            }); // open

        });
              
    }, {
        dnodeOpts: {weak: false}
    });

};

//var argv = require('minimist')(process.argv.slice(2));
//var urls = argv._;

pages.getAndMarkRandom(renderPage);
//{ name: 'frame-05.png', x: 4, y: 142, w: 1021, h: 614 }
/*renderPage({ id: 1318,
  url: 'http://sln.fi.edu/biosci/systems/systems.html',
  tstamp: '19980113210239',
  title: 'Systems',
  generator: '',
  score: 84,
  created_at: "Wed Oct 14 2015 22:24:43 GMT+0000 (UTC)",
  posted_at: null });*/


//renderUrl("https://web.archive.org/web/19950101/http://fourier.haystack.edu/menuSRT.html");
//renderUrl("./test.html");
//renderUrl("https://web.archive.org/web/19961227023309/http://www.thewebtrader.com/");

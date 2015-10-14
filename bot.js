var _ = require('lodash');
var phantom = require('phantom');
var fs = require('fs');
var cheerio = require('cheerio');

var Twit = require('twit');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var T = new Twit(conf.twitter);

var pages = require('./pages.js');

var viewportOpts = {
    width: 800,
    height: 600
};

var phantomActions = function() {
    __wm.h();
    return document;
};

var phantomParse = function(document) {
    //console.log(document);
    //    var $ = cheerio.load(document.documentElement.innerHTML);
    var $ = cheerio.load(document.all['0'].innerHTML);
    var output = {
        //        url: document.location.href,
        url: document.URL,
        date: "",
        title: $("title").text(),
        generator: ""
    };

    var d = $("#displayDayEl").get(0).attribs.title;
    //  0   1   2      3      4   5   6
    // "You are here: 7:38:05 Aug 15, 2000"

    d = d.split(' ');
    d = d[4] + " " + d[5] + " " + d[6];
    
    console.log('date is ' + d);
    output.date = d;

    var m = $('meta[name="generator"]').get(0);

    if ( typeof(m) !== "undefined" ) {
        output.generator = m.attribs.content;
    }

    return output;
};

var renderUrl = function(p) {
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

                // close wayback machine nav
                page.evaluate(phantomActions, function(result) {

                    var tweetText = p.title + "\n" + data.date + "\n" + data.url;

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

//pages.getAndMarkRandomUrl(function(url) {
//    url = "https://web.archive.org/web/" + from + "/" + url;     
//    renderUrl(url);
//});


//renderUrl("https://web.archive.org/web/19950101/http://fourier.haystack.edu/menuSRT.html");
//renderUrl("./test.html");
//renderUrl("https://web.archive.org/web/19961227023309/http://www.thewebtrader.com/");

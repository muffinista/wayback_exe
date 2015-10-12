var _ = require('lodash');
var phantom = require('phantom');
var fs = require('fs');

var Twit = require('twit');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var T = new Twit(conf.twitter);


//var argv = require('minimist')(process.argv.slice(2));
//var urls = argv._;

var pages = require('./pages.js');
var from = "19950101";

var viewportOpts = {
    width: 800,
    height: 600
};



var getText = function() {
    var lines = [];
    var files = fs.readdirSync('./text');
    for (var i in files) {
        var l = fs.readFileSync("text/" + files[i]).toString().split('\n');
        lines = lines.concat(l);
    }

    //lines = fs.readFileSync("text/modem.txt").toString().split('\n');
    console.log("loaded " + lines.length + " lines");

    var makeQueneau = require('queneau-buckets');
    var queneauBuckets = makeQueneau();
    //lines = lines.toString().split('\n');

    queneauBuckets.seed(lines);
    x = queneauBuckets.fill(20);

    return x;
};

var renderUrl = function(url) {
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
                page.evaluate(function() { __wm.h(); });
                
                title = "";
                page.evaluate(function () { return document.title; }, function (result) {
                    console.log('Page title is ' + result);
                    ph.exit();
                    title = result;
                });
                                
                page.render('page.png', function() {
                    var exec = require('child_process').execFileSync;
                    var command = [
                        'page.png',
                        'images/' + frame.name,
                        '-geometry', '+' + frame.x + '+' + frame.y,
                        'tmp.png'];
                    console.log(command.join(' '));

                    // making watermark through exec - child_process
                    exec('composite', command);

                    var imgContent = fs.readFileSync('tmp.png', { encoding: 'base64' });

                    T.post('media/upload', { media_data: imgContent }, function (err, data, response) {
                        
                        // now we can reference the media and post a tweet (media will attach to the tweet) 
                        var mediaIdStr = data.media_id_string;
                        var params = {
                            status: getText(),
                            media_ids: [mediaIdStr]
                        };
                        
                        T.post('statuses/update', params, function (err, data, response) {
                            //console.log(data);
                            console.log("done!");
                        });
                    });
                    
                });              
            });
        });
    }, {
        dnodeOpts: {weak: false}
    });

};


pages.getAndMarkRandomUrl(function(url) {
    url = "https://web.archive.org/web/" + from + "/" + url;     
    renderUrl(url);
});



//renderUrl("https://web.archive.org/web/19950101/http://fourier.haystack.edu/menuSRT.html");
//renderUrl("./test.html");
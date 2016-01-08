var _ = require('lodash');
var phantom = require('phantom');
var temp = require('temp');
var fs = require('fs');

// default viewport options for phantom. we will tweak these to match
// the browser frame that we will fit the page into. NOTE: phantom is
// a mess and probably doesn't enjoy rendering pages from 1998 either
var viewportOpts = {
    width: 1200,
    height: 1000
};

var phantomActions = function() {
    // trigger in-page js to close wayback machine nav
    if ( typeof(__wm) !== "undefined" ) {
        __wm.h();
    }

    // try and close WM js on any frames
    var list = Array.prototype.slice.call( document.getElementsByTagName("frame") );
    list.forEach(function(f) {
        if ( f && f.contentWindow && f.contentWindow.__wm ) {
            f.contentWindow.__wm.h();
        }
    });


    //
    // inject a function to iterate through all text nodes in the body, so we can clean them up a bit
    //
    function nativeSelector() {
        var walker = document.createTreeWalker(
            document.body, 
            NodeFilter.SHOW_TEXT, 
            null, 
            false
        );

        var node;
        var textNodes = [];

        // this is silly because there's no logic here, so we could just 
        // pass in a function to run against the node, but leaving for now
        while((node = walker.nextNode())) {
            textNodes.push(node);
        }

        return textNodes;
    }

    var textnodes = nativeSelector(),
        _nv;
    for (var i = 0, len = textnodes.length; i<len; i++){
        _nv = textnodes[i].textContent;

        // attempt to strip email addresses and phone numbers from output
        _nv = _nv.replace(/[A-Za-z0-9_\-\.]+\@/g, '░░░░░@').
            replace(/[\(\+]?\b[ 0-9\-\(\)+^'^"^<^>]{10,14}\b/g, function(m) { return m.replace(/[0-9]/g, "x"); });

        textnodes[i].textContent = _nv;
    }

};

var path = require('path');
var frames = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'frames.json')));

var wrap = function(src, p, frame) {
    var exec = require('child_process').execFileSync;

    var pointsize = frame["caption-font-size"] || 14;
    var caption_bgcolor = frame["caption-bgcolor"] || "white";

    var text = temp.path({prefix:'text', suffix:'.png'});
    var command = [
        "-background", "rgba(0,0,0,0.0)",
        "-fill", "black",
        "-font", "font.ttf",
        "-pointsize", pointsize,
        "label:" + p.url,
        text
    ];


    var dest = temp.path({prefix: 'results', suffix: '.png'});
    console.log(command.join(' '));
    exec('convert', command);                        

    command = [ src, 'images/' + frame.name,
                '-geometry', '+' + frame.x + '+' + frame.y, 
                dest];
    console.log(command.join(' '));

    exec('composite', command);

    
    if ( frame['caption-x']) {
        command = [ text, dest,
                    '-geometry', '+' + (frame['caption-x'] + 3) + '+' + (frame['caption-y'] + 3), 
                    dest];
        console.log(command.join(' '));
        
        exec('composite', command);
    }

    return dest;

};

var render = function(p, cb) {
    var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
    console.log(url);
    
    var frame = _.sample(frames);

    phantom.create(function (ph) {
        ph.createPage(function (page) {                       
            page.open(url, function (status) {
                console.log("status? ", status);

                // set the size of the browser to be the size of the interior of the frame
                if ( p.wrap !== "undefined" && p.wrap === true ) {
                    viewportOpts.width = frame.w;
                    viewportOpts.height = frame.h;
                }
                else {
                    console.log("no frame so use default viewport");
                }

                page.set('viewportSize', viewportOpts);
                page.set('clipRect', viewportOpts);

                page.evaluate(phantomActions, function() {

                    var guts = temp.path({prefix: 'page', suffix: '.png'});
                    page.render(guts, function() {
                        var dest;
                        console.log("**** " + p.wrap);
                        if ( p.wrap !== "undefined" && p.wrap === true ) {
                            dest = wrap(guts, p, frame);
                        }
                        else {
                            console.log("no frame!");
                            dest = guts;
                        }

                        console.log(dest);
                        ph.exit();

                        cb(dest);
                       
                    }); // render
                }); // evaluate
            }); // open

        });
              
    }, {
        dnodeOpts: {weak: false}
    });

};


exports.render = render;
/**
render({ id: 1318,
         url: 'http://yahoo.com/',
         tstamp: '19981206224454',
         title: 'Systems',
         generator: '',
         score: 84,
         created_at: "Wed Oct 14 2015 22:24:43 GMT+0000 (UTC)",
         posted_at: null 
       }, function(dest) { console.log(dest); });
*/
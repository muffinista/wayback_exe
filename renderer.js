var _ = require('lodash');
var temp = require('temp');
var fs = require('fs');

var path = require('path');
var frames = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'frames.json')));
var exec = require('child_process').execFileSync;

// default viewport options for phantom. we will tweak these to match
// the browser frame that we will fit the page into. NOTE: phantom is
// a mess and probably doesn't enjoy rendering pages from 1998 either
var viewportOpts = {
    width: 1200,
    height: 1000
};



var wrap = function(src, p, frame) {

  var pointsize = frame["caption-font-size"] || 14;
  // var caption_bgcolor = frame["caption-bgcolor"] || "white";
  
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

  console.log('convert', command.join(' '));
  exec('convert', command);                        
  
  command = [ src, 'images/' + frame.name,
              '-geometry', '+' + frame.x + '+' + frame.y, 
              dest];
  
  exec('composite', command);
    
  if ( frame['caption-x']) {
    command = [ text, dest,
                '-geometry', '+' + (frame['caption-x'] + 3) + '+' + (frame['caption-y'] + 3), 
                dest];
    
    exec('composite', command);
  }

  return dest;

};

const grabber = require('./screengrab.js');

var render = async function(p) {
  var frame = _.sample(frames);
  var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
  console.log(url);

  var dest = temp.path({prefix: 'results', suffix: '.png'});

  await grabber.render({
    url: url, width: frame.w, height: frame.h, out: dest
  });

  if ( p.wrap !== "undefined" && p.wrap === true ) {
    dest = wrap(dest, p, frame);
  }
  else {
    dest = guts;
  }
                            
  return dest;
};

exports.render = render;

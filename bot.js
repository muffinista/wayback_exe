var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');

var Twit = require('twit');

var conf = JSON.parse(fs.readFileSync('conf.json'));

const Masto = require('masto');

var pages = require('./pages.js');
var renderer = require('./renderer.js');

const DRY_RUN = (process.env.DRY_RUN === 'true');

// send the page to twitter
var tweetPage = async function(p, dest) {
  if ( DRY_RUN ) {
    console.log("Dry run, exiting tweetPage!");
    return;
  }

  var T = new Twit(conf.twitter);
  
  // it's 23 but i'm being safe
  var shortened_url_length = 24;
  
  var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
  var title = p.title;
  if ( title.length > 80 ) {
    title = title.substr(0, 76) + "...";
  }
  var date = moment(p.tstamp, "YYYYMMDDHHmmss").format("MMM YYYY");
  
  var tweetText = title + "\n" + date + "\n";
  if ( typeof(p.generator) !== "undefined" &&
  p.generator !== "" &&
  tweetText.length + p.generator.length < 138 - shortened_url_length )
  {
    tweetText = tweetText + p.generator + "\n";
  }
  
  tweetText = tweetText + url;
  
  if ( tweetText.length < 240 - shortened_url_length ) {
    var oldweb_url = "http://oldweb.today/random/" + p.tstamp + "/" + p.url;
    tweetText = tweetText + "\n" + oldweb_url;
  }
  
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
    }); // status/update
  }); // media/upload
  
};

// send the page to mastodon
var tootPage = async function(p, dest) {
  if ( DRY_RUN ) {
    console.log("Dry run, exiting tootPage!");
    return;
  }

    const masto = await Masto.login({
	url: 'https://botsin.space',
	accessToken: conf.mastodon.access_token,
    });

//  var M = new Masto(conf.mastodon);

  var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
  var title = p.title;

  var date = moment(p.tstamp, "YYYYMMDDHHmmss").format("MMM YYYY");
  
  var tweetText = title + "\n" + date + "\n";
  if ( typeof(p.generator) !== "undefined" &&
       p.generator !== "" )
  {
    tweetText = tweetText + p.generator + "\n";
  }
  
  tweetText = tweetText + url;
  
  var oldweb_url = "http://oldweb.today/random/" + p.tstamp + "/" + p.url;
  tweetText = tweetText + "\n" + oldweb_url;
  
    const attachment = await masto.mediaAttachments.create({
	file: fs.createReadStream(dest),
	description: `A screengrab of ${p.url}`

    });

  const status = await masto.statuses.create({
      status: tweetText,
      visibility: 'unlisted',
    mediaIds: [attachment.id],
  });

  console.log(status);
};

// send the page to tumblr
var postPageToTumblr = async function(p, dest) {
  if ( DRY_RUN ) {
    console.log("Dry run, exiting postPageToTumblr!");
    return;
  }

  var Tumblr = require('tumblrwks');

  var url = "https://web.archive.org/web/" + p.tstamp + "/" + p.url;
  var oldweb_url = "http://oldweb.today/random/" + p.tstamp + "/" + p.url;
  var tumblr = new Tumblr(conf.tumblr, conf.tumblr_url);
  
  var title = p.title;
  var date = moment(p.tstamp, "YYYYMMDDHHmmss").format("MMM YYYY");
  
  var caption = title + "\n" + date + "\n";
  if ( typeof(p.generator) !== "undefined" && p.generator !== "")   {
    caption = caption + p.generator + "\n";
  }
  
  caption = caption + "\n<a href='" + oldweb_url + "'>view on oldweb.today</a>";
  
  var imgContent = fs.readFileSync(dest, { encoding: 'base64' });
  tumblr.post('/post', {
    type: 'photo', 
    link: url,
    caption: caption,
    data64: imgContent
  }, function(err, json){
    console.log(err);
    console.log(json);
    pages.close();
  });
};



var renderPage = async function(p) {
  try {
    // hacky fun to pass along an option which will wrap the output in a frame
    p.wrap = true;
    
    const dest = await renderer.render(p);
    if ( typeof(dest) === "undefined" ) {
      console.log("well, better luck next time i guess");
    }
    else {
      try {
        await Promise.all([
          tweetPage(p, dest),
          tootPage(p, dest),
//          postPageToTumblr(p, dest),
        ]);
      }
      catch(e) {
        console.log("*****", e);
      }
        
      process.exit();
    }
  } catch(error) {
    console.log(error);
  }
};

/**
// you can test functionality with a little snippet like this
(async () => {
  await renderPage({ 
    id: 1318,
    url: 'http://www.insurance-life.com/',
    tstamp: '19961221011029',
    //  url: 'http://www.mcs.com/~nr706/home.html',
    //       tstamp: '19970521165416',
    title: 'Thomas Keith & Associates',
    generator: '',
    score: 84,
    created_at: "Wed Oct 14 2015 22:24:43 GMT+0000 (UTC)",
    posted_at: null
  }, true);
})();
*/


// make sure we exit at some point
setTimeout(process.exit, 120 * 1000);
(async () => {
  pages.getAndMarkRandom(renderPage);
})();



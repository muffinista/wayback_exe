var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');

var conf = JSON.parse(fs.readFileSync('conf.json'));

const Masto = require('masto');

var pages = require('./pages.js');
var renderer = require('./renderer.js');

const DRY_RUN = (process.env.DRY_RUN === 'true');


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
	description: `A screengrab of ${p.url} from ${date}`,
	focus: {
	    x: 0.0,
	    y: 1.0
	}
    });

  const status = await masto.statuses.create({
      status: tweetText,
      visibility: 'unlisted',
    mediaIds: [attachment.id],
  });

  console.log(status);
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
          tootPage(p, dest),
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



// // make sure we exit at some point
// setTimeout(process.exit, 120 * 1000);
// (async () => {
//   pages.getAndMarkRandom(renderPage);
// })();



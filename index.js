var _ = require('lodash');
var phantom = require('phantom');
var fs = require('fs');

var domains = JSON.parse(fs.readFileSync('sources.json'));
console.log(domains);

var Twit = require('twit');

var T = new Twit({
    consumer_key:         '8tVOlFLWMLSr804za1eLbF2Cs'
  , consumer_secret:      'ndHiQSkcTCCMf0wr9TvxhnpEAMSFnHtqHxXqPaFXbABtpdEBHv'
  , access_token:         '3772896857-R9Zg62lbV2lr5vSYwH1jSiqQgw8wexF5FpAD4uf'
  , access_token_secret:  '9nqxUhmjVpqP4LpQPVXaJUonG6ebu0Xp80H2XcYtvgiTT'
});


//var base_url = "tandy.com";

var base_url = _.sample(domains); //"tandy.com";

//var match = _.sample(["prefix", "exact", "exact"]);
var match = "domain";
var from="19950101";
var to = "19970101";


var url = "https://web.archive.org/cdx/search/cdx?output=json&url=" + base_url +
        "&filter=statuscode:200&filter=mimetype:text/html" +
    //        "&collapse=timestamp:6" +
        "&limit=100" +
        "&matchType=" + match +
        "&from=" + from +
        "&to=" + to;

console.log(url);

var dataToUrl = function(obj) {
  // [["urlkey","timestamp","original","mimetype","statuscode","digest","length"],
  // ["edu,rpi)/about/faq/home_page.html", "19990420100910", "http://www.rpi.edu:80/About/FAQ/home_page.html", "text/html", "200", "C4S2ZVJ2W4L72FLRSMEC2HSGRPP43YVL", "2081"],
    
  return "http://web.archive.org/web/" + obj.timestamp + "/" + obj.original;
}

//var url = "http://archive.org/wayback/available?url=amazon.com&timestamp=19950101";
var request = require('request');
request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body);

      var data = JSON.parse(body);
      var keys = data.shift();

      var objects = _.select(
        _.map(data, function(x) {
          return _.object(keys, x);        
        }),
        function(obj) {
          // strip out front page extension data
          //console.log(obj.original);
          return ( obj.original.indexOf('_vti') === -1 );
        }
      );


      console.log(objects);
      var obj = _.shuffle(objects)[0];

      console.log(obj);
      var target = dataToUrl(obj);
      console.log(target);

      //    <title>Tandy Corporation Home Page</title>
      //   <meta name="GENERATOR" content="Mozilla/2.01Gold (Win32)">
      
      phantom.create(function (ph) {
        ph.createPage(function (page) {
          page.viewportSize = {
            width: 800,
            height: 600};

          page.clipRect = { top: 0, left: 0, width: 800, height: 600 };
          
          page.open(target, function (status) {
            console.log("status? ", status);

            // close wayback machine nav
            page.evaluate(function() { __wm.h(); });

            title = "";
            page.evaluate(function () { return document.title; }, function (result) {
              console.log('Page title is ' + result);
              ph.exit();
              title = result;
            });

 
            // first we must post the media to Twitter
            //var imgContent = page.renderBase64('PNG');
            //console.log(imgContent);

            page.renderBase64('PNG', function(imgContent) {
              T.post('media/upload', { media_data: imgContent }, function (err, data, response) {
 
                // now we can reference the media and post a tweet (media will attach to the tweet) 
                var mediaIdStr = data.media_id_string
                var params = { status: title, media_ids: [mediaIdStr] }
              
                T.post('statuses/update', params, function (err, data, response) {
                  console.log(data)
                })
              });

            });


            
          });
        });
      });
    }
});

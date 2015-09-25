var _ = require('lodash');


var base_url = "rpi.edu";
var match = "prefix";
var from="19950101";
var to = "19970101";


var url = "https://web.archive.org/cdx/search/cdx?output=json&url=" + base_url +
        "&filter=statuscode:200&filter=mimetype:text/html" +
        "&collapse=timestamp:6" +
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
        console.log(body);
        // Show the HTML for the Google homepage. 
        
        // first entry is the fields
        // [["urlkey","timestamp","original","mimetype","statuscode","digest","length"],
        
        //http://web.archive.org/web/19991111072403/http://www.microsoft.com:80/2000/product/user_view2671EN.htm

        var data = JSON.parse(body);
        var keys = data.shift();

        for ( var i = 0; i < data.length; i++) {
            var obj = _.object(keys, data[i]);
          //console.log(obj);
          console.log(dataToUrl(obj));
            
            //var target = keysToArray(data[i]);
            //console.log(target);
        }
        
        
    }
});

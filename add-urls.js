var argv = require('minimist')(process.argv.slice(2));
//var q = require('./queue.js');

var fs = require('fs');

var file = argv._[0];
var urls = JSON.parse(fs.readFileSync(file));

for (var i = 0; i < urls.length; i++ ) {
    var url = urls[i];
    console.log(["HSET", '"push_check"', '"' + url + '"', '"1"'].join(' ').replace(/\r?\n/g, "\r\n"));
    console.log(["RPUSH", '"scraper_queue"', '"' + url + '"'].join(' ').replace(/\r?\n/g, "\r\n"));
}

/*q.add(urls, true);
q.client.on('idle', function() {
    console.log("idle, quitting");
    q.client.quit();
});*/

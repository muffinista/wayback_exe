var argv = require('minimist')(process.argv.slice(2));
var q = require('./queue.js');

var urls = argv._;
for(var i = 0; i < urls.length; i++ ) {
    var url = urls[i];
    console.log(url);
    q.add(url);
    q.quit();
}
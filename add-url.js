var argv = require('minimist')(process.argv.slice(2));
var q = require('./queue.js');

<<<<<<< HEAD
=======
console.dir(argv);
>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
var urls = argv._;
for(var i = 0; i < urls.length; i++ ) {
    var url = urls[i];
    console.log(url);
    q.add(url);
<<<<<<< HEAD
=======

>>>>>>> dab6045a44d4092fe26de0e76bba108f9b9a81cd
}
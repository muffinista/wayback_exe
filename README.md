wayback_exe
===========

This is the code for [wayback_exe](https://twitter.com/wayback_exe), a
bot that renders images of old web pages from the Wayback Machine and
posts them to Twitter and Tumblr.

The bot is written in node and includes a few pieces:

- **scraper.js** -- this script indexes old web pages in the Wayback
  Machine. It looks for URLs to scrape, queues them up in a redis
  store, and stores some details about the page itself in a MySQL
  database.
  
- **bot.js** -- loads a random page from the MySQL database, generates a
  screenshot of it via PhantomJS, and then fits that screenshot into
  an image of an old browser via ImageMagick. Then it sends the image
  to Twitter and Tumblr.

- A bunch of random utility scripts/etc.
  
Running the bot
---------------

If you want to run a version of this bot, these steps should get you
started:

- copy conf.json.example to conf.json
- create a Twitter account and authorize it, and put the credentials
  in conf.json
- create a MySQL database with the script in setup.sql. Add the login
  info to the config.
- setup Redis and add the credentials to the config
- Add some interesting URLs to Redis like so:

```
  nodejs add-url.js http://www.cool-old-site.com/
```

or load the contents of a JSON array of URLs into redis:

```
  nodejs add-urls.js urls.json > tmp && cat tmp | redis-cli --pipe
```


Run the scraper! I'm lazy, and currently run it like this in a
terminal window:

```
  echo "var s= require('./scraper.js'); s.loop()" | nodejs;
```


Let it run for awhile. It will scrape pages, store the results to
MySQL, and add more URLs to index to Redis. Eventually, you can send a
tweet like so:

```
  node bot.js
```


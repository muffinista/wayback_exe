var express = require('express');
var router = express.Router();

var pages = require('../models/page.js');
var renderer = require('../../renderer.js');

router.route('/')
    .get(function(req, res, next) {
        pages.getPages({}, function(err, rows) {
            res.json(rows);
        });
    });


router.get("/:id/preview", function(req, res) {
    pages.get({id: req.params.id}, function(p) {
        renderer.render(p, function(dest) {
            res.sendFile(dest);
        });
    });

});

router.get("/:id/approve", function(req, res) {
    pages.approve({id: req.params.id}, function(p) {
        res.json(true);
    });

});

module.exports = router;

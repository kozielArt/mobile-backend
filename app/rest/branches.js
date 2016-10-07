var express = require('express');
var router = express.Router();
var branchManager = require('./../managers/branchesManager');

router.get('/branches', function (req, res) {

    branchManager.getAll(function (err, branches) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify(branches));
    });
});

router.get('/branches/:branchId', function (req, res) {
    branchManager.get(req.params.branchId, function (err, branch) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application/json; charset=utf-8");

        res.end(JSON.stringify(branch));
    });
});

module.exports = router;

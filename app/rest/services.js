var express = require('express');
var router = express.Router();
var servicesManager = require('./../managers/servicesManager');

router.get('/branches/:branchId/services/', function (req, res) {
    servicesManager.getBranchServices(req.params.branchId, function (err, services) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(services));

    });
});

router.get('/branches/:branchId/services/:serviceId', function (req, res) {
    var idBranchString = req.params.branchId;
    var idServiceString = req.params.serviceId;
    servicesManager.get(idServiceString, function (err, service) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application-json");
        res.end(JSON.stringify(service));
    })
});
module.exports = router;
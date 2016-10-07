var express = require('express');
var router = express.Router();
var accountManager = require('./../managers/accountManager');

router.get("/account/:emailAddress", function (req, res) {
    accountManager.getAccount(req.params.emailAddress, function (err, user) {
        if (err) {
            res.status(400);
            res.end(JSON.stringify("Failed to find account for username."));
            return;
        }

        res.header("Content-type", "application/json");
        res.end(JSON.stringify(user));
    })
})

router.post("/account", function (req, res) {
    accountManager.createAccount(req.body, function (err, account) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(account));
    })
})

router.post("/isEmailAvailable", function (req, res) {
    accountManager.isEmailAddressAvailable(req.body.emailAddress, function (isAvailable) {
        res.header("Content-type", "application/json");
        res.end(JSON.stringify({emailAddress: req.body.emailAddress, available: isAvailable}));
    })
});

router.post("/checkCredentials", function (req, res) {
    accountManager.checkCredentials(req.body.emailAddress, req.body.password, function (err, user) {
        if (err) {
            res.status(403);
            res.end(JSON.stringify(err));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(user));
    })
});

router.get("/user/:emailAddress", function (req, res) {
    accountManager.getUserByEmailAddress(req.params.emailAddress, function (err, user) {
        if (err) {
            res.status(400);
            res.end(JSON.stringify("User with given id does not exist."));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(user));
    })
})

router.put("/account/:emailAddress", function (req, res) {
    accountManager.updateAccount(req.params.emailAddress, req.body.firstName, req.body.lastName, function (err, updatedAccount) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(updatedAccount));
        /*
         //check if a new user name is the same as the old one
         accountManager.findUserByUserName(account.username, function (err, result) {
         if (err) {
         res.status(err.status || 400);
         res.end(JSON.stringify({error: err.toString()}));
         return;
         }

         if (account.username == result.username) {
         res.status(400);
         res.end(JSON.stringify("New username has to be different from the old one."))
         return;
         }

         res.header("Content-type", "application/json");
         res.end(JSON.stringify(account));
         })*/

    })
});

router.put("/changePassword", function (req, res) {
    if (req.body.newPassword !== req.body.newPasswordConfirmed) {
        res.end(JSON.stringify("Has�a nie s� jednakowe"));
        return;
    }

    if (req.body.oldPassword === undefined || req.body.oldPassword === null) {
        res.end(JSON.stringify("Wpisz stare has�o"));
        return;
    }

    accountManager.changePassword(req.body.emailAddress, req.body.oldPassword, req.body.newPassword, function (err, result) {
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(result));
    })

})

router.put("/deleteAccount", function (req, res) {
    accountManager.deleteAccount(req.body.emailAddress, req.body.password, function (err, account) {
        if (err) {
            res.status(403);
            res.end(JSON.stringify(err));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(account));
    })
})
module.exports = router
/**
 * Created by ArturK on 2015-10-01.
 */

var mongoose = require('mongoose');
var passwordHash = require('password-hash');
var schema = new mongoose.Schema({
    emailAddress: String,
    password: String,
    firstName: String,
    lastName: String,
    properties: {},
    created: Date,
    updated: Date
});

var model = mongoose.model('Account', schema, 'account');

clearPassword = function (storedAccount) {
    if(storedAccount !=null) {
        var hashedpassword = passwordHash.generate(storedAccount.password);
        storedAccount.password = hashedpassword;
    }
    return storedAccount;
}

convertToUser = function(storedAccount){
    var userToReturn ={
        emailAddress: storedAccount.emailAddress,
        password: storedAccount.password,
        firstName: storedAccount.firstName,
        lastName: storedAccount.lastName
    }
    return clearPassword(userToReturn);
}
var manager = {
    createAccount: function (account, callback) {
        model.create(account, function (err, storedAccount) {
            callback(err, clearPassword(storedAccount));
        });
    },

    checkCredentials: function (emailAddress, password, callback) {
        model.findOne({'emailAddress': emailAddress, 'password': password}, function (err, storedAccount) {
            if(err ||  storedAccount === null){
                callback(err || "Nie odaleziono ");
            } else {
                callback(err, convertToUser(storedAccount));
            }

        })
    },
    isEmailAddressAvailable: function (emailAddress, callback) {
        model.findOne({'emailAddress': emailAddress,}, function (err, storedAccount) {
            if (storedAccount === null || storedAccount === undefined){
                callback(true);
            }
            else {
                callback(false);
            }
        })
    },

    getUserByEmailAddress: function (emailAddress, callback) {
        model.findOne({'emailAddress': emailAddress}, function (err, storedAccount) {
            console.log(storedAccount)
            callback(err, convertToUser(storedAccount));
        });
    },

    getUserById: function (id, callback) {
        model.findOne({'_id': id}, function (err, storedAccount) {
            callback(err, convertToUser(storedAccount));
        });
    },

    updateAccount: function (emailAddress, firstName, lastName, callback) {
        var account = {
            firstName: firstName,
            lastName: lastName
        }
        model.update({'emailAddress': emailAddress}, account, function(err, updatedAccount){
            callback(err, updatedAccount)
        });
    },

    getAccount: function (emailAddress, callback) {
        model.findOne({'emailAddress': emailAddress}, function (err, storedAccount) {
            callback(err, clearPassword(storedAccount));
        });
    },

    changePassword: function (emailAddress, oldPassword, newpassword, callback) {
        var foundAccount = model.findOne({'emailAddress': emailAddress, 'password': oldPassword}, function (err, storedAccount) {
            if(err ||storedAccount === null){
                callback(err)
                return
            }
        model.findOneAndUpdate({'_id': storedAccount._id}, {'password': newpassword}, {new: true}, callback);
        })
    },

    deleteAccount: function(emailAddress, password, callback){
        model.findOneAndRemove({'emailAddress': emailAddress, 'password': password}, function (err, removedAccount){
            callback(err, removedAccount);
        });
    }
}

module.exports = manager;

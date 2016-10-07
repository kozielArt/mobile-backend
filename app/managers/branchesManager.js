/**
 * Created by ArturK on 2015-09-18.
 */
var mongoose = require('mongoose');
var schema = new mongoose.Schema({
    origId: Number,
    name: String,
    description: String,
    enabled: Boolean,
    timeZone: String,
    timeZoneID: String,
    mobileEnabled: Boolean,
    bookingEnabled: Boolean,
    openingHour: String,
    closingHour: String,
    resetHour: String,
    properties: Array,
    currentlyOpen: Boolean,
    connected: Boolean,
    connectionSince: Date,
    created: Date,
    updated: Date
});
var model = mongoose.model('Branch', schema, 'branches');
var manager = {
    get: function (id, callback) {
        model.findOne({'_id': id}, callback)
    },
    getAll: function (callback) {
        model.find({}, callback);
    },
    getConnected: function (callback) {
        model.find({'connected': true}, callback);
    },
    getByOrigId: function (origId, callback) {
        model.findOne({'origId': origId}, callback)
    },
    store: function (branch, callback) {
        if (branch._id !== undefined) {
            branch.updated = new Date();
            model.findOneAndUpdate({'_id': branch._id}, {new: true}, branch, callback);
        } else {
            branch.updated = new Date();
            model.findOneAndUpdate({'origId': branch.origId},branch, {new: true} , function (err, updatedBranch) {
                if (updatedBranch) {
                    callback(err, updatedBranch)
                } else {
                    branch.updated = undefined;
                    branch.created = new Date();
                    branch.connected = true;
                    branch.currentlyOpen = true;
                    connectionSince = new Date();
                    model.create(branch, callback);
                }
            })
        }
    },
    delete: function (branch, callback) {
        model.remove({'_id': branch._id}, callback);
    },
    clear: function (callback) {
        model.remove({}, callback);
    }
};

module.exports = manager;
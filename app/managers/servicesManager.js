/**
 * Created by ArturK on 2015-09-18.
 */

var mongoose = require('mongoose');
var schema = new mongoose.Schema({
    origId: Number,
    branchId: String,
    branchOrigId: Number,
    subServiceOrigId: Number,
    name: String,
    externalName: String,
    description: String,
    externalDescription: String,
    mobileEnabled: Boolean,
    bookingEnabled: Boolean,
    properties: String,
    status: String,
    updatedBy: String,
    updated: Date,
    createdBy: String,
    created: Date
});
var model = mongoose.model('Service', schema, 'service');
var manager = {
    get: function (_id, callback) {
        model.findOne({'_id': _id}, callback);
    },
    getBranchServices: function (branchId, callback) {
        model.find({'branchId': branchId}, callback);
    },
    getByOrigId: function (branchOrigId, origId, subServiceOrigId, callback) {
        model.findOne({'origId': origId, 'branchOrigId': branchOrigId, 'subServiceOrigId': subServiceOrigId}, callback)
    },
    store: function (service, callback) {
        if (service._id !== undefined) {
            service.updated = new Date();
            model.findOneAndUpdate({'_id': service._id},service, {new: true},  callback);
        } else {
            service.updated = new Date();
            model.findOneAndUpdate({'origId': service.origId, 'subServiceOrigId': service.subServiceOrigId, 'branchId' : service.branchId},service, {new: true},  function (err, updatedService) {
                if (updatedService) {
                    callback(err, updatedService)
                } else {
                    service.updated = undefined;
                    service.created = new Date();
                    model.create(service, callback);
                }
            })
        }
    },
    delete: function (service, callback) {
        model.remove({'_id': service._id}, callback);
    },
    clear: function (callback) {
        model.remove({}, function (err) {
            callback(err);
        });
    }
};

module.exports = manager;
/**
 * Created by ArturK on 2015-09-18.
 */


var mongoose = require('mongoose');
var schema = new mongoose.Schema({
    branchId: String,
    branchName : String,
    serviceName : String,
    serviceId: String,
    origId: Number,
    branchOrigId: Number,
    serviceOrigId: Number,
    serviceSubOrigId: Number,
    transaction : {
        startTime : String,
        callTime :String,
        endTime : String,
        queueOrigId: Number,
        queueName: String,
        queueType: String,
        status: String,
        servicePointName : String,
        servicePointOrigId : String,
        staffName : String
    },
    endedTransactions:  Array,
    letter: String,
    ticketId: String,
    number: Number,
    printerName :String,
    printerType : String,
    createTime :String,
    userId: String,
    userRating : Number,
    userComment : String

});
var model = mongoose.model('Ticket', schema, 'tickets');
var manager = {
    get: function (id, callback) {
        model.findOne({'_id': id}, function (err, data) {
            callback(err, data)
        })
    },
    getAll: function (serviceId, callback) {
        model.find({'serviceId': serviceId}, callback);
    },
    getByOrigId: function (branchOrigId, origId, callback) {
        model.findOne({branchOrigId: branchOrigId, origId: origId}, function (err, data) {
            callback(err, data)
        })
    },
    store: function (ticket, callback) {
        if (ticket._id !== undefined) {
            model.findOneAndUpdate({"_id": ticket._id}, ticket, {new: true}, callback);
        } else {

            manager.getByOrigId(ticket.branchOrigId, ticket.origId, function (err, storedTicket) {
                if (storedTicket !== null) {
                    storedTicket.status = ticket.status;
                    ticket.queueName ? storedTicket.queueName = ticket.queueName : undefined;
                    ticket.queueOrigId ? storedTicket.queueOrigId = ticket.queueOrigId : undefined;
                    model.findOneAndUpdate({"_id": storedTicket._id}, storedTicket, {new: true}, callback);
                } else {
                    servicesManager.getByOrigId(ticket.branchOrigId, ticket.serviceOrigId, ticket.serviceSubOrigId, function (err, service) {
                        if (err) {
                            callback(err);
                        }
                        ticket.serviceId = service._id;
                        ticket.branchId = service.branchId;
                        model.create(ticket, callback);
                    })
                }
                ;
            })
        }
    },
    delete: function (ticket, callback) {
        model.remove({'_id': ticket._id}, callback);
    },
    clear: function (callback) {
        model.remove({}, callback);
    }
};
var servicesManager = require('./../managers/servicesManager');
module.exports = manager;

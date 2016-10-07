/**
 * Created by ArturK on 2015-10-26.
 */
var mongoose = require('mongoose');
var schema = new mongoose.Schema({
    idententification: String,
    userId: String,
    appointment: {}
});

var model = mongoose.model('Appointments', schema, 'appointments');

var manager = {
    store: function (appointment, callback) {

        model.create(appointment, function (err, storedAppointment) {
            callback(err, storedAppointment);
        });
    },

    getAppointment: function (userId, callback) {
        model.find({'userId': userId}, function (err, storedAppointment) {
            if (storedAppointment === null || storedAppointment === undefined) {
                callback(err)
            } else {
                callback(err, storedAppointment);
            }
        });
    },

    deleteAppointment: function (appointmentId, callback) {
        model.findOneAndRemove({'appointment.id': appointmentId}, function (err, removedAppointment) {
            callback(err, removedAppointment);
        });
    }
}

module.exports = manager;

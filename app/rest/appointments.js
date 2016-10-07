var express = require('express');
var router = express.Router();
var appointmentsManager = require('./../managers/appointmentsManager');

router.post("/appointment", function (req, res) {
    var appointmentToStore = {
        appointment: req.body.appointment,
        userId: req.body.userId,
        idententification: req.body.appointment.idententification
    }
    appointmentsManager.store(appointmentToStore, function (err, appointment) {
        if (err) {
            res.status(err.status || 400);
            res.end(JSON.stringify({error: err.toString()}));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(appointment));
    })
})

router.get("/appointment/:userId", function (req, res) {
    appointmentsManager.getAppointment(req.params.userId, function (err, appointment) {
        if (err) {
            res.status(400);
            res.end(JSON.stringify("Appointment does not exist."));
            return;
        }
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(appointment));
    })
})

router.put("/appointment/delete", function (req, res) {
    appointmentsManager.deleteAppointment(req.body.id, function (err, removedAppointment) {
        if (err) {
            res.status(403);
            res.end(JSON.stringify(err));
            return;
        }
        console.log("removed appointment", removedAppointment)
        res.header("Content-type", "application/json");
        res.end(JSON.stringify(removedAppointment));
    })
})
module.exports = router;
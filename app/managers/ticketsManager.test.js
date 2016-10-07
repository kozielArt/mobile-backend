var assert = require("assert");
var expect = require("chai").expect;
var db = require('./../db/db');
var ticketsManager = require('./../managers/ticketsManager')

describe('Tickets Model', function () {
    it('should clear all tickets', function (done) {
            assert.doesNotThrow(function () {
                ticketsManager.clear(function (err) {
                    expect(err).to.be.equal(null);
                    done();
                })
            });
        }
    )
    it('should store  ticket', function (done) {
            assert.doesNotThrow(function () {
                var ticket = ticketsManager.convertOrigTicket({ticketId : 1, queueName : "Kolejka 1", branchId : 2, serviceId : 1})
                ticketsManager.store(ticket, function (err, storedTicket) {
                    expect(err).to.be.equal(null);
                    console.log("\nstoredTicket\n",storedTicket)
                    expect(storedTicket).not.to.be.equal(null);
                    done();
                })
            });
        }
    )
});



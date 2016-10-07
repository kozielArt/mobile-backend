var assert = require("assert");
var expect = require("chai").expect;
var WebSocket = require('ws');


describe('WebSocket client connection handler', function () {
    it("should connected to ws channell", function (done) {
        var ws = new WebSocket('ws://127.0.0.1:5000/ws/client/');
        ws.on('open', function () {
            console.log("on open")
            connected = true;
            done();
        });
        ws.on('error', function (error) {
            connected = false;
            assert.equal(error, null, "Error on connectiong to WS")
            done();
        });
    })
    it("should send and recieve init message", function (done) {
        var ws = new WebSocket('ws://127.0.0.1:5000/ws/client/');

        ws.on('open', function () {
            connected = true;
            ws.send(JSON.stringify({operation: "INIT", data: {}}));
        });
        ws.on('error', function (error) {
            connected = false;
            assert.equal(error, null, "Error on connectiong to WS")
            done();
        });
        ws.on('message', function (data) {
            var message = JSON.parse(data)
            expect(message.operation).to.be.eql("INIT_RESPONSE");
            done();
        });
    })
});



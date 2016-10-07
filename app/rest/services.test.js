var assert = require("assert");
var expect = require("chai").expect;
var http = require('http');

describe('Services Model', function () {

    var branchToGet = null;
    var serviceToGet = null;
    it('should get all branches and select one to test', function (done) {
            assert.doesNotThrow(function () {
                http.get({host: '127.0.0.1', port: 5000, path: '/rest/branches/'}, function (response) {
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        var branches = JSON.parse(body);
                        expect(branches).to.have.length(2);
                        branchToGet = branches[1];
                        done();
                    });
                });
            });
        }
    )
    it('should get all services from test branch ', function (done) {
            assert.doesNotThrow(function () {
                expect(branchToGet).not.to.be.equals(null)
                http.get({
                    host: '127.0.0.1',
                    port: 5000,
                    path: '/rest/branches/' + branchToGet._id + '/services/'
                }, function (response) {
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        console.log(body)
                        var services = JSON.parse(body);
                        expect(services).to.have.length.above(0);
                        serviceToGet = services[0];
                        done();
                    });

                });
            });
        }
    )
    it('should get first service from test branch by id', function (done) {
            assert.doesNotThrow(function (done) {
                expect(branchToGet).not.to.be.equals(null);
                expect(serviceToGet).not.to.be.equals(null);
                http.get({
                    host: '127.0.0.1',
                    port: 5000,
                    path: '/rest/branches/' + branchToGet._id + '/services/' + serviceToGet._id
                }, function (response) {
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        console.log(body)
                        var service = JSON.parse(body);
                        expect(service.origId).to.be.eql(serviceToGet.origId);
                        done();
                    });

                });
            });
        }
    )

});



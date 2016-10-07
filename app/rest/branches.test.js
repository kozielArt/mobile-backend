var assert = require("assert");
var expect = require("chai").expect;
var http = require('http');

describe('Branches Model', function () {

    var branchToGet;

    it('should get all branches', function (done) {
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
    it('should get one branch', function (done) {
            assert.doesNotThrow(function () {
                http.get({
                    host: '127.0.0.1',
                    port: 5000,
                    path: '/rest/branches/' + branchToGet._id
                }, function (response) {
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        console.log(body)
                        var branch = JSON.parse(body);
                        expect(branch.origId).to.be.eql(branchToGet.origId);
                        done();
                    });

                });
            });
        }
    )

});



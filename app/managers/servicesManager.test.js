var assert = require("assert");
var expect = require("chai").expect;
var db = require('./../db/db');
var servicesManager = require('./../managers/servicesManager')
var branchesManager = require('./../managers/branchesManager')
describe('Services Model', function () {
    var testBranchOrigId = 2;
    var testBranch;
    before(function (done) {
        branchesManager.getByOrigId(2, function (err, branch) {
            testBranch = branch;
            done();
        });
    });

    it('should clear all services', function (done) {
            assert.doesNotThrow(function () {
                servicesManager.clear(function (err) {
                    expect(err).to.be.equal(null);
                    done();
                })
            });
        }
    )
});



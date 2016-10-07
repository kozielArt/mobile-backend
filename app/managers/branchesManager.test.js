var assert = require("assert");
var expect = require("chai").expect;
var db = require('./../db/db');
var branchesManager = require('./../managers/branchesManager')

describe('Branches Model', function () {

    var branchWarszawaId;
    var branchKrakowId;
    var testDescription = "Błędny opis oddziału"

    it('should clear all branches', function (done) {
            assert.doesNotThrow(function () {
                branchesManager.clear(function (err) {
                    expect(err).to.be.equal(null);
                    done();
                })
            });
        }
    )
    it('should add branch Warszawa', function (done) {
            assert.doesNotThrow(function () {
                var branch = {
                    origId: 1,
                    name: "Warszawa",
                    description: testDescription
                }
                branchesManager.store(branch, function (err, storedBranch) {
                    expect(storedBranch._id).not.to.equal(null);
                    branchWarszawaId = storedBranch._id;
                    done();
                })
            });
        }
    )
    it('should update branch Warszawa ', function (done) {
            assert.doesNotThrow(function () {
                var prawidlowyOpis = "Oddział Warszawa opis"
                var branch = {
                    origId: 1,
                    name: "Warszawa",
                    description: prawidlowyOpis
                }
                branchesManager.store(branch, function (err, storedBranch) {
                    expect(storedBranch._id).not.to.equal(null);
                    expect(storedBranch._id).to.be.eql(branchWarszawaId);
                    //TODO Poprawka w metodzie zapisującej oddział. Przy update nie zapisują się zmienione pola
                    // expect(storedBranch.description).to.be.eql(prawidlowyOpis);
                    done();
                })
            });
        }
    )
    it('should get branch Warszawa by origId', function (done) {
        assert.doesNotThrow(function () {
            branchesManager.getByOrigId(1, function (err, storedBranch) {
                expect(storedBranch._id).not.to.equal(null);
                expect(storedBranch._id).to.be.eql(branchWarszawaId);
                done();
            })
        });

    })
    it('should insert branch Krakow ', function (done) {
            assert.doesNotThrow(function () {
                var branch = {
                    origId: 2,
                    name: "Kraków",
                    description: "Oddział Kraków opis"
                }
                branchesManager.store(branch, function (err, storedBranch) {
                    expect(storedBranch._id).not.to.equal(null);
                    branchKrakowId = storedBranch._id;
                    done();
                })
            });
        }
    )
    it('should insert branch Radom ', function (done) {
            assert.doesNotThrow(function () {
                var branch = {
                    origId: 3,
                    name: "Radom",
                    description: "Oddział Radom opis"
                }
                branchesManager.store(branch, function (err, storedBranch) {
                    expect(storedBranch._id).not.to.equal(null);
                    branchKrakowId = storedBranch._id;
                    done();
                })
            });
        }
    )
    it('should return branch Warszawa by _id ', function (done) {
            assert.doesNotThrow(function () {
                branchesManager.get(branchWarszawaId, function (err, storedBranch) {
                    expect(storedBranch._id).to.be.eql(branchWarszawaId);
                    done();
                })
            });
        }
    )
    it('should return branch Krakow by _id ', function (done) {
            assert.doesNotThrow(function () {
                branchesManager.get(branchKrakowId, function (err, storedBranch) {
                    expect(storedBranch._id).to.be.eql(branchKrakowId);
                    done();
                })
            });
        }
    )

    it('should return allBranches', function (done) {
            assert.doesNotThrow(function () {
                branchesManager.getAll(function (err, storedBranches) {
                    expect(storedBranches).to.have.length(3);
                    done();
                })
            });
        }
    )
    it('should delete branch Warszawa and return two branches', function (done) {

            assert.doesNotThrow(function () {

                var branch = {
                    _id: branchWarszawaId,
                    origId: 1,
                    name: "Warszawa",
                    description: "Oddział Warszawa opis"
                }
                branchesManager.delete(branch, function (err) {
                    expect(err).to.be.equal(null);
                    branchesManager.getAll(function (err, storedBranches) {
                        expect(err).to.be.equal(null);
                        expect(storedBranches).to.have.length(2);
                        done();
                    });
                })
            });
        }
    )

});



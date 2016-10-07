var should = require('should');
var app = require('./../app');
var request = require('supertest');
var assert = require("assert");
var http = require('http');

describe('Account Model', function () {

    var data = {
        emailAddress: "arcczi@gmail.com",
        password: "123",
        firstName: "Artur",
        lastName: "Kozie³"
    };
    var loginData = {
        emailAddress: "arcczi@gmail.com",
        password: "123"
    };
    var loginFakeData = {
        emailAddress: "aasdasda",
        password: "1sada"
    };

    it('should respond with new account on post', function (done) {
        request('127.0.0.1:5000')
            .post('/rest/account')
            .send(data)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) done(err);
                res.body.should.have.property('emailAddress');
                res.body.should.have.property('password');
                (data.emailAddress).should.equal(res.body.emailAddress);
                (data.firstName).should.equal(res.body.firstName);
                (data.lastName).should.equal(res.body.lastName);
                (data.password).should.not.equal(undefined)
                done();
            });
    });

    //to run this test successfully, change the port number, and at to the database an object "data".
    it('should get one user', function (done) {
            assert.doesNotThrow(function () {
                http.get({
                    host: '127.0.0.1',
                    port: 5000,
                    path: '/rest/user/' + data.emailAddress
                }, function (response) {
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        console.log(body)
                        var account = JSON.parse(body);
                        (account.emailAddress).should.equal(data.emailAddress);
                        done();
                    });

                });
            });
        }
    )

    it('should return true if email is taken, true if there is no email in the db', function (done) {
        request('127.0.0.1:5000')
            .post('/rest/isEmailAvailable')
            .send(data.emailAddress)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) done(err);
                (true).should.equal(res.body.available);
                done();
            });
    });

    it('should return true if object with given email and password exists', function (done) {
        request('127.0.0.1:5000')
            .post('/rest/checkCredentials')
            .send(loginData)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) done(err);
                //login credentials are ok.
                (true).should.equal(res.body);
                done();
            });
    });
    it('should return false if login credentials are wrong', function (done) {
        request('127.0.0.1:5000')
            .post('/rest/checkCredentials')
            .send(loginFakeData)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) done(err);
                //login credentials are ok.
                (false).should.equal(res.body);
                done();
            });
    });
});





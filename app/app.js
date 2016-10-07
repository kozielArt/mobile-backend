var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require("./db/db");

var routes = require('./routes/index');
var branchesRest = require('./rest/branches');
var servicesRest = require('./rest/services');
var ticketsRest = require('./rest/tickets');
var account = require('./rest/account');
var appointments = require('./rest/appointments')
var app = express();

var cors = require('cors');
app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/rest/',cookieParser());
app.use('/rest/',bodyParser.json());
app.use('/rest/',bodyParser.urlencoded({extended: false}));
app.use('/rest/', branchesRest);
app.use('/rest/', servicesRest);
app.use('/rest/', ticketsRest);
app.use('/rest/', account);
app.use('/rest/', appointments)

var iflowProxy = require('./routes/iflow-proxy');
var proxyToOrchestra = iflowProxy('http://192.168.2.192:8080');
app.use('/ic-calendar/', proxyToOrchestra);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    console.log(err);
  //  res.status(err.status || 500);
  //  res.render('error', {
 //       message: err.message,
 //       error: {}
  //  });
});


module.exports = app;

/**
 * Created by Tomasz on 2015-09-28.
 */

var WebSocketServer = require('ws').Server;
var instances = [];
module.exports.createInstance = function (name, server, path, handler) {
    var wss = new WebSocketServer({server: server, path: path});
    wss.instanceName = name;
    wss.getClient = function (clientId) {
        for (var i = 0; i < this.clients.length; i++) {
            var client = this.clients[i];
            if (client.clientId == clientId)
                return client;
        }
        return null;
    };
    var connectionsCounter = 1;
    wss.on('connection', function (ws) {
        ws.clientId = connectionsCounter++;
        ws.handler = new AbstractHandler(ws, handler);
        ws.handler.setConnection(ws);

        ws.on('open', function () {
            this.handler.onOpen();
        });
        ws.on('message', function (message, flags) {
            this.handler.onMessage(message, flags);
        });
        ws.on('close', function () {
            this.handler.onClose();
        });
        ws.on('error', function (error) {
            this.handler.onError(error);
        });
    });
    instances.push(wss);
    return wss;
};

module.exports.getInstance = function (name) {
    for (var i = 0; i < instances.length; i++) {
        var instance = instances[i];
        if (instance.instanceName === name) {
            return instance;
        }
    }
};

var AbstractHandler = function (ws, handler) {
    this.ws;
    this.handler = handler;
    this.setConnection = function (connection) {
        this.ws = connection;
    };
    this.onMessage = function (message, flags) {
        var obj = JSON.parse(message);
        if (this.handler.onMessage) this.handler.onMessage(obj.operation, obj.data, this.ws.clientId);
    };
    this.onError = function (error) {
        if (this.handler.onError) this.handler.onError(error, this.ws.clientId);
    };
    this.onClose = function () {
        if (this.handler.onClose) this.handler.onClose(this.ws.clientId);
    };
    this.onOpen = function () {
        if (this.handler.onOpen) this.handler.onOpen(this.ws.clientId);
    }
};
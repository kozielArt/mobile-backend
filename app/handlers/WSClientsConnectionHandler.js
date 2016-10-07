/**
 * Created by Tomasz on 2015-09-28.
 */


var server;
var ticketsServiceFactory = require('./../services/ticketsService');
var ticketsService;
module.exports = {

    onMessage: function (operation, data, clientId) {
        console.log("ClientMessagesHandler onMessage Client[id=" + clientId + "] " + operation, data);
        switch (operation) {
            case 'WATCH_TICKET' :
                ticketsService.subscribe(data.branchOrigId, data.origId, clientId, function (err, ticket){
                    if (err) {
                        send("WATCH_TICKET_ERROR" ,{error : err }, clientId);
                        return
                    }
                    send("WATCH_TICKET_STARTED" ,{ticket : ticket }, clientId);
                });
                break;
            case 'LEAVE_TICKET' :
                break;
            case 'CANCEL_TICKET' :
                break;
            case 'INIT' :
                send("INIT_RESPONSE", {text: "Hello World"}, clientId);
                break;
            default:
                console.log("ClientMessagesHandler onMessage unable to process operation '" + operation + "' handler not found");
        }
    },
    onOpen: function (clientId) {
        console.log("ClientMessagesHandler onOpen Client[id=" + clientId + "]");
    },
    onClose: function (clientId) {
        console.log("ClientMessagesHandler onClose Client[id=" + clientId + "]");
        ticketsService.unsubscribe(clientId);
    },
    onError: function (error, clientId) {
        console.log("ClientMessagesHandler onError Client[id=" + clientId + "]", error);
    }
};
function send(operation, data, clientId) {
    try {
        var client = server.getClient(clientId);
            client.send(JSON.stringify({operation: operation, data: data}));
    }catch (e){
        console.error("Error on sending "+operation+ " to client with id "+clientId , e)
    }
}

module.exports.send = send;
module.exports.setServer = function (serverInstance) {
    server = serverInstance;
    ticketsService = ticketsServiceFactory.getInstance();
};

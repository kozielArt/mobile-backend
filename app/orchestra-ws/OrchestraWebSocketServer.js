var  _ = require('lodash'),
    networkNode = require('./NetworkNode')(),
    Peer = require('./Peer'),
    WebSocketServer = require('ws').Server,
    ticketsServiceFactory = require('./../services/ticketsService');
var ticketsService;
var instance;
var branchesManager = require('./../managers/branchesManager');
var servicesManager = require('./../managers/servicesManager');
var ticketsManager = require('./../managers/ticketsManager');
var forEach = require('async-foreach').forEach;

var branchInfoRegistry = {};


function synchronizeBranch(branchId) {
    console.log('synchronizeBranch ' + branchId + '...');

    networkNode.sendCommand('MOBILE_GET_FULL_BRANCH_INFO', branchId, null,
        function (result) {
            var branch = result.branch;
            branchInfoRegistry[branch.id] = result;
            var branchToStore = {
                origId: branch.id,
                name: branch.name,
                description: branch.description,
                enabled: branch.enabled,
                timeZone: branch.timeZone,
                timeZoneID: branch.timeZoneID,
                mobileEnabled: branch.mobileEnabled,
                bookingEnabled: branch.bookingEnabled,
                openingHour: branch.openingHour,
                closingHour: branch.closingHour,
                resetHour: branch.resetHour,
                properties: {
                    longitude: branch.properties.longitude,
                    latitude: branch.properties.latitude,
                    country: branch.properties.country,
                    city: branch.properties.city,
                    postcode: branch.properties.postcode,
                    address1: branch.properties.address1,
                    address2: branch.properties.address2,
                    address3: branch.properties.address3
                },
                currentlyOpen: branch.currentlyOpen,
                connected: false,
                connectionSince: null,
                created: null,
                updated: null
            }
            branchesManager.store(branchToStore, function (err, storedBranch) {
                if (err) {
                    console.error(err);
                    return;
                }
                var services = result.services;
                forEach(services, function processService(service) {
                        var done = this.async();
                        var serviceToStore = {
                            origId: service.serviceId,
                            branchId: storedBranch._id,
                            branchOrigId: storedBranch.origId,
                            subServiceOrigId: service.serviceSubId,
                            name: service.overridenName ? service.overridenName : service.internalName,
                            externalName: service.booexternalNamekingEnabled,
                            description: service.internalDescription,
                            externalDescription: service.externalDescription,
                            mobileEnabled: service.mobileEnabled,
                            bookingEnabled: service.bookingEnabled,
                            properties: [],
                            status: service.status,
                            updatedBy: null,
                            updated: null,
                            createdBy: null,
                            created: null
                        }
                        servicesManager.store(serviceToStore, function (err, storedService) {
                            if (err) {
                                console.error(err);
                                done(false);
                            }else{
                                done();
                            }


                        })
                    },function processVisits() {
                        var tickets = result.visits;
                        var storedVisits = 0;
                        forEach(tickets, function (ticket) {
                            var ticketToStore = {
                                branchId: storedBranch._id,
                                serviceId: null,
                                origId: ticket.ticketId,
                                branchOrigId: branchId,
                                serviceOrigId: ticket.currentVisitService.serviceId,
                                serviceSubOrigId: ticket.parameterMap.serviceSubId || 0,
                                queueOrigId: ticket.queueId,
                                status: 'WAITING',
                                letter: ticket.ticketId.substr(0, 1),
                                number: ticket.ticketId.substr(1, ticket.ticketId.length - 1)
                            }
                        }, function(){
                            console.log("synchronizeBranch " + branchId + " completed")
                        })

                    });
            });

        }, function (param) {
            console.log('synchronizeBranch ' + branchId + ' failure' ,param.message);
        });
}

networkNode.registerEventHandler('JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit transfered: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_CREATE', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit created: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_CREATE', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_CALL', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit called: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_CALL', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_END', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit ended: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_REMOVE', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_REMOVE', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit removed: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_REMOVE', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_RECYCLE', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit recycled: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_RECYCLE', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_TRANSFER_TO_SERVICE_POINT_POOL', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit transfered to servicepoint pool: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_TRANSFER_TO_SERVICE_POINT_POOL', params.origParams);
});
networkNode.registerEventHandler('JIQL_VISIT_VISIT_TRANSFER_TO_USER_POOL', function (branchId, params) {
    console.log('BranchId: ', branchId, ': Visit transfered to user pool: ', params.origParams.ticket, params.origParams.mobile ? "MOBILE" : "NOT_MOBILE" );
    if (params.origParams.mobile)
        ticketsService.handleMobileTicketLifecycleEvent('JIQL_VISIT_VISIT_TRANSFER_TO_USER_POOL', params.origParams);
});
networkNode.registerEventHandler('AGENT_MOBILE_RELOAD', function (branchId, params) {
    console.log('Received reload request, branchId: ', branchId);
    synchronizeBranch(branchId);
});

networkNode.addCommandWatch('MOBILE_GET_FULL_BRANCH_INFO', function (branchId) {
    networkNode.registerBranch(branchId);
    console.log('Registered branch with id ', branchId);
    synchronizeBranch(branchId);
});
networkNode.addCommandWatch('MOBILE_CREATE_VISIT', function (branchId) {

    console.log("MOBILE_CREATE_VISIT ", branchId);
});

module.exports.createInstance = function (server, path) {
    var wss = new WebSocketServer({server: server, path: path});
    wss.instanceName = "orchestra-ws";
    var connectionsCounter = 1;
    wss.on('connection', function (ws) {
        ws.clientId = connectionsCounter++;
        ws.peer = new Peer(ws, networkNode);
        networkNode.onConnect(ws.peer);
    });
    instance = wss;
    ticketsService = ticketsServiceFactory.getInstance();
    return wss;
}

module.exports.getInstance = function (name) {
    return instance;
};

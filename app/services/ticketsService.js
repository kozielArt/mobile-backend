//var WSHandler = require("./../handlers/WSHandler")
var ticketsManager = require("./../managers/ticketsManager");
var _ = require("lodash");
/**
 * Created by ArturK on 2015-09-18.
 */

var TicketsService = function () {

    this.subscriptions = [];
    this.clientsConnectionHandler;
    this.orchestraConnectionHandler;
    var that = this;
    this.subscribe = function (branchOrigId, origId, clientId, callback) {
        console.log("TicketsService subscribe clientId:" + clientId, branchOrigId, origId);
        ticketsManager.getByOrigId(branchOrigId, origId, function (err, storedTicket) {
            if (storedTicket === undefined || storedTicket === null) {
                callback("Ticket not found " +  branchOrigId +" "+ origId)
                return
            }
            that.subscriptions.push({branchOrigId:storedTicket.branchOrigId,  origId: storedTicket.origId, id: storedTicket._id, clientId: clientId});
            callback(undefined, storedTicket);
        });
    };
    this.unsubscribe = function (clientId) {
        console.log("TicketsService  unsubscribe clientId:" + clientId);
        var removed  = _.remove(this.subscriptions, function (entry) {
            return entry.clientId == clientId;
        });
        console.log("Removed following Subscription ", removed);

    };
    this.resolveClientId = function (branchOrigId, origId) {
        console.log("TicketsService resolveClientId for ticket with origId =", origId);
        for (var i = 0; i < this.subscriptions.length; i++) {
            var subscription = this.subscriptions[i];
            if (subscription.origId === origId && subscription.branchOrigId === branchOrigId) {
                return subscription.clientId;
            }
        }
       return null;
    };
    this.notifySubscribers = function (ticket) {
        console.log("TicketsService notifySubscribers:", ticket);
        var clientId = this.resolveClientId(ticket.branchOrigId, ticket.origId);
        if (clientId != null)
            that.clientsConnectionHandler.send("TICKET_UPDATED", ticket, clientId);
    };

    this.createTicket = function (service, params, callback) {
    //services, customers, appointmentId, userId, delay, parameters
        params.subServiceId = parseInt(service.subServiceOrigId)
        params.mobile = true;
        var data = {
            services: [service.origId],
            parameters: params
        }
        that.orchestraConnectionHandler.sendCommand("MOBILE_CREATE_VISIT",service.branchOrigId, data,
            function onSuccess(commandResponse) {
                console.log("MOBILE_CREATE_VISIT successs");
                commandResponse.state = "CREATED"
                commandResponse.branchId = service.branchOrigId;
                callback(undefined, commandResponse);
            },
            function onFailure(err){
                console.log("MOBILE_CREATE_VISIT err", err)
                callback(err);
            }
        )
    };
    this.handleMobileTicketLifecycleEvent = function (eventName, eventParams) {
        console.log('handleTicketLifecycleEvent ' + eventName );
        switch (eventName) {
            case 'JIQL_VISIT_VISIT_CREATE' :
                //Utworzenie nowego biletu,
                var ticketId = eventParams.ticket;
                var id = eventParams.visitId;
                var serviceId = eventParams.service;
                var serviceSubId = eventParams.subServiceId ? eventParams.subServiceId : 0;
                var queueId = eventParams.queueOrigId;
                var queueName = eventParams.queueName;
                var ticket = {
                    branchId: "",
                    serviceId: "",
                    origId: id,
                    branchOrigId: eventParams.branchId,
                    branchName: eventParams.branchName,
                    serviceName: eventParams.serviceExtName,
                    serviceOrigId: serviceId,
                    serviceSubOrigId: serviceSubId,
                    transaction: {
                        startTime: eventParams.eventTime,
                        callTime: undefined,
                        endTime: undefined,
                        queueName: queueName,
                        queueType: eventParams.queueType,
                        queueOrigId: queueId,
                        servicePointName: undefined,
                        servicePointOrigId: undefined,
                        staffName: undefined,
                        status: "WAITING"
                    },
                    endedTransactions: [],
                    printerName: eventParams.unitName,
                    printerType: eventParams.type,
                    letter: ticketId.substring(0, 1),
                    number: ticketId.substring(1, ticketId.length),
                    ticketId: ticketId,
                    createTime: eventParams.eventTime,
                    userId: undefined,
                    userRating: undefined,
                    userComment: undefined
                }
                //Zapis w mongo
                ticketsManager.store(ticket, function (err, storedTicket) {
                    that.notifySubscribers(storedTicket);
                });
                break;
            case 'JIQL_VISIT_VISIT_CALL':
                //Sprawdzenie czy bilet istnieje, pobranie
                var executionTimeout = 0;
                if (eventParams.walkDirect && eventParams.walkDirect === true) {
                    executionTimeout = 2000;
                }
                //zapis utworzenia biletu nie zdarzy si� wykona� zanim przychodzi visitCall
                setTimeout(function () {
                    var ticketOrigId = eventParams.visitId
                    var branchOrigId = eventParams.branchId
                    ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {

                        if (ticket != null) {
                            //Update i zapis
                            ticket.transaction.callTime = eventParams.callTime;
                            ticket.transaction.status = 'SERVING';
                            ticket.transaction.servicePointName = eventParams.servicePointName;
                            ticket.transaction.servicePointOrigId = eventParams.servicePointLogicId;
                            ticket.transaction.staffName = eventParams.firstName + " " + eventParams.lastName;
                            ticketsManager.store(ticket, function (err, storedTicket) {
                                //Broadcast
                                that.notifySubscribers(storedTicket);
                            })
                        }else {
                            console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_CALL - bilet nie zosta� odnaleziony");
                        }
                    });
                }, executionTimeout);
                break;
            case 'JIQL_VISIT_VISIT_END':
                //Sprawdzenie czy bilet istnieje, pobranie
                var ticketOrigId = eventParams.visitId
                var branchOrigId = eventParams.branchId
                ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {
                    if (ticket != null) {
                        //Zapis starej transakcji opcjonalnie
                        var endedTransaction = JSON.parse(JSON.stringify(ticket.transaction));
                        endedTransaction.endTime = eventParams.eventTime;
                        endedTransaction.status = 'ENDED_BY_VISIT_END'
                        ticket.endedTransactions.push(endedTransaction);
                        //Update i usuniecie aktywnej transakcji
                        ticket.transaction = {};
                        // zapis
                        ticketsManager.store(ticket, function (err, storedTicket) {
                            //Broadcast
                            that.notifySubscribers(storedTicket);
                        })
                    } else {
                        console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_END - bilet nie zosta� odnaleziony");
                    }
                })

                break;
            case 'JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE':
                //Sprawdzenie czy bilet istnieje, pobranie
                var ticketOrigId = eventParams.visitId
                var branchOrigId = eventParams.branchId
                ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {
                    //Zapis starej transakcji opcjonalnie

                    if (ticket != null) {
                        //Zapis starej transakcji
                        var endedTransaction = JSON.parse(JSON.stringify(ticket.transaction));
                        endedTransaction.endTime = eventParams.eventTime;
                        endedTransaction.status = 'ENDED_BY_TRANSFER_TO_QUEUE'
                        ticket.endedTransactions.push(endedTransaction);

                        //Update i utworzenie nowej transakcji
                        ticket.transaction.startTime = eventParams.eventTime;
                        ticket.transaction.callTime = undefined;
                        ticket.transaction.endTime = undefined;
                        ticket.transaction.status = 'WAITING';
                        ticket.transaction.servicePointName = undefined;
                        ticket.transaction.servicePointOrigId = undefined;
                        ticket.transaction.staffName = undefined;
                        ticket.transaction.queueOrigId=eventParams.queueOrigId;
                        ticket.transaction.queueName= eventParams.queueName;
                        ticket.transaction.queueType= eventParams.queueType;
                        // zapis
                        ticketsManager.store(ticket, function (err, storedTicket) {
                            //Broadcast
                            that.notifySubscribers(storedTicket);
                        })
                    } else {
                        console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE - bilet nie zosta� odnaleziony");
                    }
                })
                break;
            case 'JIQL_VISIT_VISIT_RECYCLE' :
                //Sprawdzenie czy bilet istnieje, pobranie
                var ticketOrigId = eventParams.visitId
                var branchOrigId = eventParams.branchId
                ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {
                    //Zapis starej transakcji opcjonalnie

                    if (ticket != null) {
                        //Zapis starej transakcji
                        var endedTransaction = JSON.parse(JSON.stringify(ticket.transaction));
                        endedTransaction.endTime = eventParams.eventTime;
                        endedTransaction.status = 'ENDED_BY_VISIT_RECYCLE'
                        ticket.endedTransactions.push(endedTransaction);

                        //Update i utworzenie nowej transakcji
                        ticket.transaction.startTime = eventParams.eventTime;
                        ticket.transaction.callTime = undefined;
                        ticket.transaction.endTime = undefined;
                        ticket.transaction.status = 'WAITING';
                        ticket.transaction.servicePointName = undefined;
                        ticket.transaction.servicePointOrigId = undefined;
                        ticket.transaction.staffName = undefined;
                        // zapis
                        ticketsManager.store(ticket, function (err, storedTicket) {
                            //Broadcast
                            that.notifySubscribers(storedTicket);
                        })
                    } else {
                        console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE - bilet nie zosta� odnaleziony");
                    }
                })
                break;
            case 'JIQL_VISIT_VISIT_REMOVE' :
                //Sprawdzenie czy bilet istnieje, pobranie
                var ticketOrigId = eventParams.visitId
                var branchOrigId = eventParams.branchId
                ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {
                    if (ticket != null) {
                        //Zapis starej transakcji opcjonalnie
                        var endedTransaction = JSON.parse(JSON.stringify(ticket.transaction));
                        endedTransaction.endTime = eventParams.eventTime;
                        endedTransaction.status = 'ENDED_BY_VISIT_REMOVE'
                        ticket.endedTransactions.push(endedTransaction);
                        //Update i usuniecie aktywnej transakcji
                        ticket.transaction = {};
                        // zapis
                        ticketsManager.store(ticket, function (err, storedTicket) {
                            //Broadcast
                            that.notifySubscribers(storedTicket);
                        })
                    } else {
                        console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_END - bilet nie zosta� odnaleziony");
                    }
                })

                break;
            case 'JIQL_VISIT_VISIT_TRANSFER_TO_SERVICE_POINT_POOL' :
                //Sprawdzenie czy bilet istnieje, pobranie
                var ticketOrigId = eventParams.visitId
                var branchOrigId = eventParams.branchId
                ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {
                    //Zapis starej transakcji opcjonalnie

                    if (ticket != null) {
                        //Zapis starej transakcji
                        var endedTransaction = JSON.parse(JSON.stringify(ticket.transaction));
                        endedTransaction.endTime = eventParams.eventTime;
                        endedTransaction.status = 'ENDED_BY_VISIT_TRANSFER_TO_SERVICE_POINT_POOL'
                        ticket.endedTransactions.push(endedTransaction);

                        //Update i utworzenie nowej transakcji
                        ticket.transaction.startTime = eventParams.eventTime;
                        ticket.transaction.callTime = undefined;
                        ticket.transaction.endTime = undefined;
                        ticket.transaction.status = 'WAITING';
                        ticket.transaction.servicePointName = undefined;
                        ticket.transaction.servicePointOrigId = undefined;
                        ticket.transaction.staffName = undefined;
                        ticket.transaction.queueOrigId=eventParams.queueOrigId;
                        ticket.transaction.queueName= "STANOWISKO";
                        ticket.transaction.queueType= "SERVICE_POINT_POOL";
                        // zapis
                        ticketsManager.store(ticket, function (err, storedTicket) {
                            //Broadcast
                            that.notifySubscribers(storedTicket);
                        })
                    } else {
                        console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE - bilet nie zosta� odnaleziony");
                    }
                })
                break;
            case 'JIQL_VISIT_VISIT_TRANSFER_TO_USER_POOL' :
                //Sprawdzenie czy bilet istnieje, pobranie
                var ticketOrigId = eventParams.visitId
                var branchOrigId = eventParams.branchId
                ticketsManager.getByOrigId(branchOrigId, ticketOrigId, function (err, ticket) {
                    //Zapis starej transakcji opcjonalnie

                    if (ticket != null) {
                        //Zapis starej transakcji
                        var endedTransaction = JSON.parse(JSON.stringify(ticket.transaction));
                        endedTransaction.endTime = eventParams.eventTime;
                        endedTransaction.status = 'ENDED_BY_VISIT_TRANSFER_TO_USER_POOL'
                        ticket.endedTransactions.push(endedTransaction);

                        //Update i utworzenie nowej transakcji
                        ticket.transaction.startTime = eventParams.eventTime;
                        ticket.transaction.callTime = undefined;
                        ticket.transaction.endTime = undefined;
                        ticket.transaction.status = 'WAITING';
                        ticket.transaction.servicePointName = undefined;
                        ticket.transaction.servicePointOrigId = undefined;
                        ticket.transaction.staffName = undefined;
                        ticket.transaction.queueOrigId=eventParams.queueOrigId;
                        ticket.transaction.queueName= "KOLEJKA PRACOWNIKA";
                        ticket.transaction.queueType= "USER_POOL";
                        // zapis
                        ticketsManager.store(ticket, function (err, storedTicket) {
                            //Broadcast
                            that.notifySubscribers(storedTicket);
                        })
                    } else {
                        console.warn("Nieudana obs�uga eventu JIQL_VISIT_VISIT_TRANSFER_TO_QUEUE - bilet nie zosta� odnaleziony");
                    }
                })
                break;
        }
    }
};

var singleton = new TicketsService();
singleton.clientsConnectionHandler = require('./../handlers/WSClientsConnectionHandler');
singleton.orchestraConnectionHandler = require('./../orchestra-ws/NetworkNode')();

module.exports.getInstance = function () {
    return singleton
};
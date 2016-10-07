var _ = require('lodash'),
    inHandler = require('./IncomingHandler'),
    outConf = require('./OutgoingConfiguration'),
    msgRegistry = require('./MessageRegistry'),
    messageTypes = require('./NetworkConstants').messageTypes,
    messageTemplate = require('./NetworkConstants').messageTemplate;

var instance;
module.exports = function() {
 if (instance === undefined )
     instance = new Node();
    return instance;
}

function Node(){
    var id = -10000;
    var peers = [];
    var incomingHandler = inHandler();
    var messageRegistry = msgRegistry();
    var outgoingConfiguration = outConf();
    /*
     watches = {
        METHOD1: [function(){}, ...],
        ...
     }
     */
    var watches = {};

    var processMessage = function(message, peer){
        switch(message.type){
            case messageTypes.EVENT:
                incomingHandler.handleEvent(message.method, message.branchId, message.object);
                break;
            case messageTypes.COMMAND:
                var response = _.clone(messageTemplate);
                try {
                    response.object = incomingHandler.handleCommand(message.method, message.branchId, message.object);
                    if(typeof(response.object) === 'undefined')
                        response.object = null;
                    response.type = messageTypes.RESPONSE;
                }catch(ex){
                    response.object = ex;
                    response.type = messageTypes.RESPONSE_EXCEPTION;
                }
                response.id = message.id;
                peer.sendMessage(response);
                break;
            case messageTypes.RESPONSE:
                messageRegistry.received(message.id, message.object);
                break;
            case messageTypes.RESPONSE_EXCEPTION:
                messageRegistry.receivedException(message.id, message.object);
                break;
        }
    };

    var processInit = function(init, peer){
        var descriptorsToSend = outgoingConfiguration.onInit(init, peer);
        if(descriptorsToSend.length > 0){
            var init = {
                type: init.type,
                descriptors: descriptorsToSend
            };
            _.forEach(peers, function(otherPeer){
                if(otherPeer === peer)
                    return;
                otherPeer.sendInit(init);
            });
        }
        if(init.type === 'ADD'){
            _.forEach(init.descriptors, function(descriptor){
                if(descriptor.type === messageTypes.COMMAND && _.isArray(watches[descriptor.method])){
                    _.forEach(watches[descriptor.method], function(callback){
                        try{
                            callback(descriptor.branchId);
                        }catch(ex){
                            console.error('Exception caught while handling command watch(method: ', descriptor.method, ', branchId: ', descriptor.branchId, '): ', ex.stack);
                        }
                    });
                }
            });
        }
    };

    var getId = function(){
        if(id === 10000)
            id = -10000;
        return ++id;
    };

    return {

        sendEvent: function(method, branchId, params){
            var peers = outgoingConfiguration.getPeersForEvent(method, branchId);
            var message = _.clone(messageTemplate);
            message.branchId = branchId;
            message.method = method;
            message.object = params;
            message.type = messageTypes.EVENT;
            message.id = getId();
            _.forEach(peers, function(peer){
                peer.sendMessage(message);
            });
        },

        sendCommand: function(method, branchId, params, successCallback, failureCallback){
            var peer = outgoingConfiguration.getPeerForCommand(method, branchId);
            if(peer === null) {
                try{
                    throw 'No remote handler found for method ' + method;
                }catch(ex){
                    if(_.isFunction(failureCallback)){
                        failureCallback(ex);
                    }
                }
                return;
            }
            var message = _.clone(messageTemplate);
            message.branchId = branchId;
            message.method = method;
            message.object = params;
            message.type = messageTypes.COMMAND;
            message.id = getId();
            messageRegistry.register(message.id, successCallback, failureCallback);
            peer.sendMessage(message);
        },

        onRawMessage: function(str, peer){
            try {
                var jsonBegin = str.indexOf('{');
                if (jsonBegin === -1)
                    return;
                var msgType = str.substr(0, jsonBegin);
                msgType = msgType.toLowerCase();
                var strTmp = str.substr(jsonBegin);
                if(msgType === 'init') {
                    processInit(JSON.parse(strTmp), peer);
                }else if(msgType === 'message'){
                    processMessage(JSON.parse(strTmp));
                }else{
                    console.warn('Unknown message type: ', msgType, 'message: ', str);
                }
            }catch(ex){
                console.error("Exception caught while processing incoming message", ex.stack);
            }
        },

        onConnect: function(peer){
            console.log('QAgent  '+peer.conn.clientId+' connected.' );
            peers.push(peer);
            var descriptorsLocal = incomingHandler.getDescriptors();
            var descriptorsRemote = outgoingConfiguration.getDescriptors(peer);
            var descriptors = _.union(descriptorsLocal, descriptorsRemote);
            descriptors = _.uniq(descriptors, false, function(elem){
                return [elem.type, elem.method, elem.branchId].join(';');
            });
            var tmpInit = {
                type: 'ADD',
                descriptors: descriptors
            };
            peer.sendInit(tmpInit);
        },

        onDisconnect: function(peer){
            var descriptorsRemoved = outgoingConfiguration.peerRemoved(peer);
            var initRemove = {
                type: 'REMOVE',
                descriptors: descriptorsRemoved
            };
            _.forEach(peers, function(otherPeer){
                if(peer === otherPeer)
                    return;
                otherPeer.sendInit(initRemove);
            });
            var pos = peers.indexOf(peer);
            if(pos !== -1)
                peers.splice(pos, 1);
            console.log('QAgent  '+peer.conn.clientId+' disconnected ' );
        },

        registerCommandHandler: function(method, handler){
            var isAdded = incomingHandler.registerCommandHandler(method, handler);
            if(! isAdded)
                return;
            var descriptors = [];
            _.forEach(incomingHandler.getBranchIds(), function(branchId){
                descriptors.push({
                    type: messageTypes.COMMAND,
                    branchId: branchId,
                    method: method
                });
            });
            if(descriptors.length > 0) {
                var init = {
                    type: 'ADD',
                    descriptors: descriptors
                };
                _.forEach(peers, function (peer) {
                    peer.sendInit(init);
                });
            }
        },

        registerEventHandler: function(method, handler){
            var isNew = incomingHandler.registerEventHandler(method, handler);
            if(! isNew)
                return;
            var descriptors = [];
            _.forEach(incomingHandler.getBranchIds(), function(branchId){
                descriptors.push({
                    type: messageTypes.EVENT,
                    branchId: branchId,
                    method: method
                });
            });
            if(descriptors.length > 0) {
                var init = {
                    type: 'ADD',
                    descriptors: descriptors
                };
                _.forEach(peers, function (peer) {
                    peer.sendInit(init);
                });
            }
        },

        registerBranch: function(branchId){
            var isNew = incomingHandler.registerBranch(branchId);
            if(! isNew)
                return;
            var descriptors = [];
            _.forEach(incomingHandler.getCommandMethods(), function(method){
                descriptors.push({
                    type: messageTypes.COMMAND,
                    branchId: branchId,
                    method: method
                });
            });
            _.forEach(incomingHandler.getEventMethods(), function(method){
                descriptors.push({
                    type: messageTypes.EVENT,
                    branchId: branchId,
                    method: method
                });
            });
            if(descriptors.length > 0) {
                var init = {
                    type: 'ADD',
                    descriptors: descriptors
                };
                _.forEach(peers, function (peer) {
                    peer.sendInit(init);
                });
            }
        },

        addCommandWatch: function(method, callback){
            if(!_.isFunction(callback))
                return;
            if(!_.isArray(watches[method]))
                watches[method] = [];
            watches[method].push(callback);
        }

    };
};
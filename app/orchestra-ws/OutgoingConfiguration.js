var _ = require('lodash'),
    messageTypes = require('./NetworkConstants').messageTypes;

module.exports = function(){

    /*
     commandHandlers = {
        METHOD1: {
            1: peer
        }
     };

     eventHandlers = {
        METHOD1: {
            1: [
                peer,
                peer
            ]
        }
     }
     */
    var commandHandlers = {};
    var eventHandlers = {};

    return {

        onInit: function(init, peer){
            var descriptors = [];
            if(init.type === 'ADD'){
                _.forEach(init.descriptors, function(descriptor){
                    var returnDescriptor = false;
                    if(descriptor.type === messageTypes.EVENT){
                        if(!_.isObject(eventHandlers[descriptor.method])) {
                            eventHandlers[descriptor.method] = {};
                            returnDescriptor = true;
                        }
                        if(!_.isArray(eventHandlers[descriptor.method][descriptor.branchId])) {
                            eventHandlers[descriptor.method][descriptor.branchId] = [];
                            returnDescriptor = true;
                        }
                        eventHandlers[descriptor.method][descriptor.branchId].push(peer)
                    }else if(descriptor.type === messageTypes.COMMAND){
                        if(!_.isObject(commandHandlers[descriptor.method])) {
                            commandHandlers[descriptor.method] = {};
                            returnDescriptor = true;
                        }
                        if(!_.isObject(commandHandlers[descriptor.method][descriptor.branchId])) {
                            commandHandlers[descriptor.method][descriptor.branchId] = peer;
                            returnDescriptor = true;
                        }
                    }
                    if(returnDescriptor){
                        descriptors.push(descriptor);
                    }
                });
            }if(init.type === 'REMOVE'){

            }
            return descriptors;
        },

        getPeersForEvent: function(method, branchId){
            if(!_.isObject(eventHandlers[method]))
                return [];
            if(!_.isArray(eventHandlers[method][branchId]))
                return [];
            return eventHandlers[method][branchId];
        },

        getPeerForCommand: function(method, branchId){
            if(!_.isObject(commandHandlers[method]))
                return null;
            if(!_.isObject(commandHandlers[method][branchId]))
                return null;
            return commandHandlers[method][branchId];
        },

        getDescriptors: function(peerIgnored){
            var descriptors = [];
            _.forEach(commandHandlers, function(branchCommandHandler, method){
                _.forEach(branchCommandHandler, function(peer, branchId){
                    if(peer !== peerIgnored){
                        descriptors.push({
                            type: messageTypes.COMMAND,
                            branchId: branchId,
                            method: method
                        });
                    }
                });
            });
            _.forEach(commandHandlers, function(branchCommandHandler, method){
                _.forEach(branchCommandHandler, function(peerList, branchId){
                    if(peerList.length > 1 || (peerList.length === 1 && peerList[0] !== peerIgnored)){
                        descriptors.push({
                            type: messageTypes.EVENT,
                            branchId: branchId,
                            method: method
                        });
                    }
                });
            });
            return descriptors;
        },

        peerRemoved: function(peerRemoved){
            var descriptors = [];
            _.forEach(commandHandlers, function(branchCommandHandler, method){
                _.forEach(branchCommandHandler, function(peer, branchId){
                    if(peer === peerRemoved){
                        descriptors.push({
                            type: messageTypes.COMMAND,
                            branchId: branchId,
                            method: method
                        });
                    }
                });
            });
            _.forEach(eventHandlers, function(branchEventHandler, method){
                _.forEach(branchEventHandler, function(peerList, branchId){
                    if(peerList.length === 1 && peerList[0] === peerRemoved){
                        descriptors.push({
                            type: messageTypes.EVENT,
                            branchId: branchId,
                            method: method
                        });
                    }
                });
            });
            _.forEach(descriptors, function(descriptor){
                var collection;
                if(descriptor.type === messageTypes.COMMAND){
                    collection = commandHandlers;
                }else if(descriptor.type === messageTypes.EVENT){
                    collection = eventHandlers;
                }else{
                    return;
                }
                delete collection[descriptor.method][descriptor.branchId];
                if(_.keys(collection[descriptor.method]).length === 0)
                    delete collection[descriptor.method];
            });
            return descriptors;
        }

    };

};
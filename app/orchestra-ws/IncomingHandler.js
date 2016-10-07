var _ = require('lodash'),
    messageTypes = require('./NetworkConstants').messageTypes;

module.exports = function(){

    /*
    event handlers structures:
    {
        METHOD1: [ // wzorcowe - bez brancha
            function(){...},
            function(){...},
            ...
        ],
        METHOD2:[
            ...
        ],
        ...
    }

     command handlers structures:
     {
         METHOD1:  function(){...},
         METHOD2: function(){...},
         ...
     }
     */

    var commandHandlers = {};

    var eventHandlers = {};

    var branchIds = [];

    var getEventMethods = function(){
        return _.keys(eventHandlers);
    };

    var getCommandMethods = function(){
        return _.keys(commandHandlers);
    };

    return {

        handleEvent: function(method, branchId, param){
            if(branchIds.indexOf(branchId) === -1)
                return;
            var handlers = eventHandlers[method];
            if(!_.isArray(handlers))
                return;
            _.forEach(handlers, function(handler){
                if(!_.isFunction(handler))
                    return;
                try {
                    handler(branchId, param);
                }catch(ex){
                    console.error('Exception caught while running event handler for method: ', method, ', branchId: ', branchId, 'param: ', param, ': ', ex.stack);
                }
            });
        },

        handleCommand: function(method, branchId, params){
            if(branchIds.indexOf(branchId) === -1)
                return;
            var handler = commandHandlers[method];
            if(!_.isFunction(handler))
                return;
            return handler(branchId, params);
        },

        registerCommandHandler: function(method, handler){
            if(!_.isFunction(handler)) {
                return undefined;
            }
            if(!_.isFunction(commandHandlers[method])){
                commandHandlers[method] = handler;
                return true;
            }else{
                console.error('Trying to register command handler for method ', method, ', but already registered');
                return false;
            }
        },

        registerEventHandler: function(method, handler){
            var isNew = false;
            if(!_.isFunction(handler)) {
                return undefined;
            }
            if(!_.isArray(eventHandlers[method])){
                eventHandlers[method] = [];
                isNew = true;
            }
            eventHandlers[method].push(handler);
            return isNew;
        },

        registerBranch: function(branchId){
            if(branchIds.indexOf(branchId) == -1) {
                branchIds.push(branchId);
                return true;
            }else{
                return false;
            }
        },

        getDescriptors: function(){
            var ret = [];
            var cmdMethods = getCommandMethods();
            var evtMethods = getEventMethods();
            _.forEach(branchIds, function(branchId){
                _.forEach(evtMethods, function(method){
                    ret.push({
                        type: messageTypes.EVENT,
                        method: method,
                        branchId: branchId
                    });
                });
                _.forEach(cmdMethods, function(method){
                    ret.push({
                        type: messageTypes.COMMAND,
                        method: method,
                        branchId: branchId
                    });
                });
            });
            return ret;
        },

        getBranchIds: function(){
            return branchIds;
        },

        getEventMethods: getEventMethods,

        getCommandMethods: getCommandMethods

    };
};
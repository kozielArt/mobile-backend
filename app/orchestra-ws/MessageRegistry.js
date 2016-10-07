var _ = require('lodash');

module.exports = function(){

    var successRegistry = {};

    var failureRegistry = {};

    var runCallbacks = function(id, callback, param){
        delete successRegistry[id];
        delete failureRegistry[id];
        if(callback){
            try {
                callback(param);
            }catch(ex){
                console.error('Exception caught while running Response Callback: ', ex.stack);
            }
        }
    };

    return {

        register: function(id, successCallback, failureCallback){
            if(typeof(id) !== 'number')
                return;
            if(_.isFunction(successCallback)){
                successRegistry[id] = successCallback;
            }
            if(_.isFunction(failureCallback)){
                failureRegistry[id] = failureCallback;
            }
        },

        received: function(id, param){
            var callback = successRegistry[id];
            runCallbacks(id, callback, param);
        },

        receivedException: function(id, param){
            var callback = failureRegistry[id];
            runCallbacks(id, callback, param);
        }

    };

};
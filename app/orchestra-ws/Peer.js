var Peer = function(conn, node) {

    this.node = node;
    this.conn = conn;

    var that = this;

    that.conn.on('message', function (str) {
        that.node.onRawMessage(str, that);
    });
    that.conn.on('close', function (code, reason) {
        that.node.onDisconnect(that);
    });

};

module.exports = Peer;

Peer.prototype.sendMessage = function(message){
    this.conn.send('Message' + JSON.stringify(message));
};

Peer.prototype.sendInit = function(init){
    this.conn.send('Init' + JSON.stringify(init));
};
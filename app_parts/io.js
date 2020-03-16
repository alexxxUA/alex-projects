const socketIO = require('socket.io');
const bridje = require('./bridje');

class IO {
    init(http) {
        this.io = socketIO(http);
        this.io.on('connection', this.onConnect.bind(this, http));
    }
    onConnect(socket) {
        console.log('Client connected is connected');
        bridje.init(io, socket);
    }
}

module.exports = new IO();

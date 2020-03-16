
class Bridje {
    init(io, socket) {
        this.is = io;
        this.socket = socket;
        this.events();
    }
    events(){
        this.socket.on('hostCreateNewGame', this.onHostCreateNewGame.bind(this));

    }
    onHostCreateNewGame(e){
        console.log('New Game creation');
    }
}

module.exports = new Bridje();

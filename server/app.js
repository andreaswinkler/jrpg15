var app = require('http').createServer(), 
    io = require('socket.io').listen(app), 
    js = require('./jrpg-server.js');

// start listening
app.listen(1337);

// register handlers once a client connects
io.sockets.on('connection', function(socket) {

    socket.on('login', function(d) {

        socket.emit('login', js.login(socket, d.playername, d.password));
    
    }); 
    
    socket.on('gamelist', function(d) {
    
        socket.emit('gamelist', js.gamelist(socket, d));
    
    });
    
    socket.on('creategame', function(d) {
    
        socket.emit('creategame', js.createGame(socket, d));
    
    });
    
    socket.on('joingame', function(d) {
    
        socket.emit('joingame', js.joinGame(socket, d));
    
    });
    
    socket.on('gameloaded', function(d) {
    
        socket.emit('gameloaded', js.onClientGameLoaded(socket, d));
    
    });
    
    socket.on('leavegame', function(d) {
    
        socket.emit('leavegame', js.leaveGame(socket, d));
    
    });
    
    socket.on('disconnect', function() {
    
        js.logout(socket);
    
    });
    
    socket.on('debug', function() {
    
        js.debug = socket;
    
    });
    
    // welcome the client
    socket.emit('greeting', { version: js.version });   

});

// start server loop
js.run();
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
    
    socket.on('cmd', function(d) {
    
        switch (d[0]) {
        
            case 'grab':
            
                js.grab(socket, d[1]);
                
                socket.emit('grab', d[1]);
            
                break;
        
            case 'unequip':
            
                js.unequip(socket, d[1], d[2]);
                
                break;
            
            case 'equip':
            
                js.equip(socket, d[1], d[2]);
                
                break;
            
            case 'pickup':
            
                js.pickup(socket, d[1]);

                break;
            
            case 'sell':
            
                js.grab(socket, d[1]);
                js.sell(socket);
                
                break;
            
            case 'buy':
            
                js.grab(socket, d[1]);
                js.buy(socket);
                
                break;
            
            case 'drop':
            
                js.drop(socket);
            
                break;
                
            case 'place':
            
                js.place(socket, d[1], d[2], d[3]);
                
                break;    
                
        }
    
    });
    
    socket.on('debug', function() {
    
        js.debug = socket;
        
        js.debugInfo();
    
    });
    
    // welcome the client
    socket.emit('greeting', { version: js.version });   

});

// start the server loop
js.run();
// app acts like a protocol parser and is the counterpart of the net module 
// on the client-side
var app = require('http').createServer(), 
    io = require('socket.io').listen(app),
    underscore = require('underscore'), 
    data = require('./../store/settings.json'),
    flags = require('./../shared/flags.json'), 
    core = require('./../shared/core.js'),
    itemFactory = require('./itemFactory.js'), 
    characterFactory = require('./characterFactory.js')(core),
    map = require('./map.js')(io, underscore), 
    player = require('./player.js')(underscore, flags, core, data.settings, itemFactory, characterFactory),
    game = require('./game.js')(underscore, map), 
    server = require('./server.js')(io, underscore, player, game, map);
    
// start listening
app.listen(1337);

// register handlers once a client connects
io.sockets.on('connection', function(socket) {

    server.events.forEach(function(event) {
    
        socket.on(event, function(data) {
        
            server[event](event, socket, data);
        
        });
    
    });

    // greet the client
    socket.emit('greeting', { version: server.version });

});

// start the server loop
server.run();                                                                                                                                                                              
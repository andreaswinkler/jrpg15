// app acts like a protocol parser and is the counterpart of the net module 
// on the client-side
var app = require('http').createServer(), 
    io = require('socket.io').listen(app, { log: false }),
    underscore = require('underscore'), 
    data = require('./../store/settings.json'),
    flags = require('./../shared/flags.json'), 
    core = require('./../shared/core.js'),
    item = require('./item.js')(underscore, flags, data.dropTables, data.items, data.gemRanks, data.itemRanks, data.itemRarities, data.itemQualities, data.itemAffixes, core), 
    entity = require('./entity.js')(underscore, core, flags, data.entities, item),
    env = require('./env.js')(underscore, entity, core), 
    map = require('./map.js')(io, underscore, env, entity, flags, core), 
    player = require('./player.js')(underscore, flags, core, data.settings, entity),
    game = require('./game.js')(underscore, map), 
    server = require('./server.js')(io, underscore, player, game, map, env, entity);
    
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
// app acts like a protocol parser and is the counterpart of the net module 
// on the client-side
var app = require('http').createServer(), 
    io = require('socket.io').listen(app, { log: false }),
    fs = require('fs'), 
    underscore = require('underscore'), 
    data = require('./../store/settings.json'),
    flags = require('./../shared/flags.json'), 
    core = require('./../shared/core.js'),
    item = require('./item.js')(underscore, flags, data.dropTables, data.items, data.gemRanks, data.itemRanks, data.itemRarities, data.itemQualities, data.itemAffixes, core), 
    entity = require('./entity.js')(underscore, core, flags, data.entities, item),
    env = require('./env.js')(underscore, entity, core), 
    map = require('./map.js')(io, underscore, env, entity, flags, core), 
    player = require('./player.js')(underscore, fs, flags, core, data.settings, entity),
    game = require('./game.js')(underscore, map), 
    server = require('./server.js')(io, underscore, player, game, map, env, entity);
    
// start listening
app.listen(1337);

var Utils = require('./../shared/utils.js')();

var Game = {
    entities: [], 
    validatePosition: function(entity, x, y) {
        return true;    
    },
    onEntityCreated: function(ev) {
        this.entities.push(ev.target);
    },
    onEntityDied: function(ev) {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i] === ev.target) {
                this.entities.splice(i, 1);
                i--;
            }
        }
        Events.notify('entity_remove', ev.target);
    }
}

var Config = require('./../store/config.json');

var Components = {
    '_Move': require('./../shared/components.move.js')(Utils, Game), 
    '_Experience': require('./../shared/components.experience.js')(), 
    '_ExperienceProvider': require('./../shared/components.experience-provider.js')(), 
    '_Health': require('./../shared/components.health.js')(), 
    '_Energy': require('./../shared/components.energy.js')(), 
    '_Armor': require('./../shared/components.armor.js')(Config), 
    '_Statistics': require('./../shared/components.statistics.js')(), 
    '_Shield': require('./../shared/components.shield.js')(Config), 
    '_Dodge': require('./../shared/components.dodge.js')(), 
    '_Flee': require('./../shared/components.flee.js')(Utils), 
    '_Aggro': require('./../shared/components.aggro.js')(Utils), 
    '_Attack': require('./../shared/components.attack.js')(Utils),
    '_Ethnicity': require('./../shared/components.ethnicity.js')(), 
    '_Map': require('./../shared/components.map.js')(Config), 
    '_Damage': require('./../shared/components.damage.js')(), 
    '_Rank': require('./../shared/components.rank.js')(Config), 
    '_Spawner': require('./../shared/components.spawner.js')(Utils, Config), 
    '_Vitality': require('./../shared/components.vitality.js')(Config), 
    '_Intelligence': require('./../shared/components.intelligence.js')(Config),  
    '_Dexterity': require('./../shared/components.dexterity.js')(Config),
    '_Strength': require('./../shared/components.strength.js')(Config), 
    '_Balance': require('./../shared/components.balance.js')(),
    '_Inventory': require('./../shared/components.inventory.js')(), 
    '_Equipment': require('./../shared/components.equipment.js')(Utils)
}

var ItemFactory = require('./item-factory.js')(Config, Utils, underscore);

var itemFactory = new ItemFactory();

var sword = itemFactory.create({
    rank: 'legendary',
    type: 'smallsword', 
    level: 9
}, 1);

console.log(sword);

var Events = {
    observers: {}, 
    notify: function(event, target, payload) {
        var ev = {
            target: target, 
            payload: payload
        };
        this.log(event, target, payload);
        if (this.observers[event]) {
            for (var i = 0; i < this.observers[event].length; i++) {
                if (this.observers[event][i][2] == null || this.observers[event][i][2] === target) {
                    this.observers[event][i][0].call(this.observers[event][i][1], ev);
                    if (ev.stop) {
                        console.log('event propagation stopped', event);
                        break;
                    }
                }
            }
        }
    },
    log: function(event, target, payload) {
        console.log(event, target.name);
    },
    observe: function(events, handler, context, target) {
        var events = [].concat(events), 
            event, i;
            
        for (i = 0; i < events.length; i++) {
        
            event = events[i];
        
            if (!this.observers[event]) {
                this.observers[event] = [];
            }
            this.observers[event].push([handler, context, target || null]);
        
        }

    },
    unobserve: function(event, handler, context, target) {
        if (this.observers[event]) {
            for (var i = 0; i < this.observers[event].length; i++) {
                if (this.observers[event][i][1] == context && this.observers[event][i][2] == (target || null)) {
                    this.observers[event].splice(i, 1);
                    i--;
                }
            }
        }
    },
    unobserveAll: function(target) {
        for (var key in this.observers) {
            for (var i = 0; i < this.observers[key].length; i++) {
                if (this.observers[key][i][2] === target) {
                    this.observers[key].splice(i, 1);
                    i--;
                }
            }
        }
    },
    observeFrame: function(handler, context, target) {
        this.observe('frame', function(ev) {
            handler.call(this, ev.payload.ticks); 
        }, context, target);    
    },
    unobserveFrame: function(handler, context, target) {
        this.unobserve('frame', handler, context, target);    
    }
}

var Blueprints = require('./../store/blueprints.json');

Events.observe('zero_health', Game.onEntityDied, Game);

Events.observe('entity_create', function(ev) {

    var blueprint = underscore.extend({}, Blueprints[ev.payload.blueprint], ev.payload.settings);

    new Entity(blueprint);

});

var Entity = require('./../shared/entity.js')(Game, Components, Events, Utils);

var hero = new Entity(Blueprints['hero']);

hero.notify('equip', { item: sword });

console.log(hero);

/*var mapdata = require('./../store/maps/2.json');
var mapBlueprint = underscore.extend({}, Blueprints['map']);
mapBlueprint.name = mapdata.name;
// create a map
var Map = new Entity(mapBlueprint);
// add all map elements
for (var i = 0; i < mapdata.spawnPoints.length; i++) {
    var spawnPointBlueprint = underscore.extend({}, Blueprints['spawnPoint'], mapdata.spawnPoints[i]);
    new Entity(spawnPointBlueprint);
}

var hero = new Entity(Blueprints['hero']);

hero._Move.moveTo(400, 400);

var tsStart = Date.now;

/*setInterval(function() {

    var now = Date.now;

    Events.notify('frame', Game, { ticks: now - tsStart });

    tsStart = now;

}, 500);

console.log(hero);*/

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
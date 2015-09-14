"use strict";

module.exports = function(io, _, Env, Entity, F, Core) {

    return {
    
        /* LOAD
        *  load and initialize a map
        *  this is called when the first player in a game enters a new 
        *  map                
        */        
        load: function(mapId, player) {
        
            var map = require('./../store/maps/' + mapId + '.json');
            
            map.players = [];
            map.heroes = [];
            map.creatures = [];
            map.lootables = [];
            map.level = player.hero.level || 1;
            
            // temporary, create empty grid
            if (!map.grid) {
            
                var w = 100;
                var h = 100;
                var total = w * h;
                var grid = [];
                var r = 0;
                var c = 0;
                var ts = 50;
            
                for (var i = 0; i < total; i++) {
                
                    c = i % w;
                    r = ~~(i / h);
                
                    grid.push({
                        x: c * ts, 
                        y: r * ts, 
                        // set all tiles walkable except the ones at the border
                        walkable: (c > 0 && c < w - 1 && r > 0 && r < h - 1)
                    });    
                
                }
                
                map.grid = grid;
            
                // here we'd like to setup everything graphical about the 
                // map
            
            }

            this.addPlayerToMap(player, map, map.landingPoints.entry);
            
            return map;
        
        }, 
        
        /* ENTER
        *  add a player to a map by removing it from all others and add it 
        *  to the new one
        */
        enter: function(player, mapId, maps) {
        
            var map;
        
            // walk through all maps and remove player
            _.each(maps, function(e, ind, list) {
            
                e.players = _.without(e.players, player); 
                e.heroes = _.without(e.heroes, player.hero);
                
                // we found the map
                if (e._id == mapId) {
                
                    map = e;
                    
                    // add the player to the map
                    this.addPlayerToMap(player, map);
                
                }   
            
            });
            
            // the map is not in the game yet
            if (!map) {
            
                // load the map and assign the player
                map = this.load(mapId, player);
                
                // add the new map to the list of maps
                maps.push(map);
            
            } 
        
        }, 
        
        // RUN - Server-side Map-level game loop
        run: function(map) {
                
            map.updates = null;
        
            _.each(map.heroes, function(hero) {
            
                Env.runEntity(hero, map);
            
            });
            
            // loop through all creatures
            // loop through all objects
            
            // check if we need to spawn something
            if (map.spawnPoints.length > 0) {
            
                _.each(map.spawnPoints, function(spawnPoint) {
                
                    if (Core.inRangeOfAny(spawnPoint, map.heroes)) {
                    
                        this.spawn(map, spawnPoint.x, spawnPoint.y, spawnPoint.spawn);            
                    
                    }
                
                }, this);
            
            }
            
            if (map.updates) {
            
                _.each(map.players, function(player) {
                
                    player._socket.emit('updates', map.updates);
                
                });    
            
            }
        
        }, 
        
        /* TRANSPORTIZE
        *  prepare map object for transportation via WebSocket
        */ 
        transportize: function(map) {
        
            return [map._id, map.name, map.level, map.grid];
        
        }, 

// PRIVATE SECTION /////////////////////////////////////////////////////////////

        // add a player to a map and add the map reference to the player
        addPlayerToMap: function(player, map, landingPoint) {
        
            map.players.push(player);
            map.heroes.push(player.hero);
            
            player._map = map;
            player.hero._map = map;
        
            player.hero.x = landingPoint.x;
            player.hero.y = landingPoint.y;
        
            Entity.moveTo(player.hero, landingPoint.x, landingPoint.y);
        
        }, 
        
        // spawn something
        spawn: function(map, x, y, settings) {
        
            // determine type: either the spawn point has a specific list 
            // of spawns, otherwise we fall back to the map-wide list 
            // then we randomly get an element from this list       
            var type = Core.randomElement(settings.type || map.creatures), 
            
            // determine the rank object rank to spawn: if not set 
            // we always assuem a 'normal' object (normal creature, normal
            // chest, etc)
                rank = settings.rank || F.NORMAL, 
                entity;
            
            // let's go through the types and handle creation
            switch (type) {
            
                case F.CHEST:
                
                    map.lootables.push(Entity.create(type, rank, x, y, map));
                
                    break;
                
                case F.HYSTRIX:
                
                    map.creatures.push(Entity.create(type, rank, x, y, map));
                
                    break;
            
            }     
        
        
        }               
    
    };

};
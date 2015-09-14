"use strict";

module.exports = function(io, _, Env) {

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
            
            this.addPlayerToMap(player, map);
            
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
            
                Env.runEntity(hero);
            
            });
            
            // loop through all creatures
            // loop through all objects
            
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
        
            return [map._id, map.name];
        
        }, 

// PRIVATE SECTION /////////////////////////////////////////////////////////////

        // add a player to a map and add the map reference to the player
        addPlayerToMap: function(player, map) {
        
            map.players.push(player);
            map.heroes.push(player.hero);
            
            player._map = map;
            player.hero._map = map;
        
        }               
    
    };

};
"use strict";

module.exports = function(io, _, Env, Entity, F, Core) {

    return {
    
        /* LOAD
        *  load and initialize a map
        *  this is called when the first player in a game enters a new 
        *  map                
        */        
        load: function(mapId, player) {
        
            var map = Core.clone(require('./../store/maps/' + mapId + '.json'));
            
            map.players = [];
            map.heroes = [];
            map.creatures = [];
            map.lootables = [];
            map.projectiles = [];
            map.droppedItems = [];
            map.level = player.hero.level || 1;
            
            // calculate the map dimensions in pixels by multiplying the grid 
            // size by the tile size constant
            map._width = map.width * Core.TS;
            map._height = map.height * Core.TS;
            
            // temporary, create empty grid
            if (!map.grid) {
            
                var total = map.width * map.height;
                var grid = {};
                var r = 0;
                var c = 0;
            
                for (var i = 0; i < total; i++) {
                
                    c = i % map.width;
                    r = ~~(i / map.height);
                
                    grid[r + '_' + c] = {
                        x: c * Core.TS, 
                        y: r * Core.TS,
                        z: 0,  
                        // set all tiles walkable except the ones at the border
                        walkable: (c > 0 && c < map.width - 1 && r > 0 && r < map.height - 1)
                    };    
                
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
                    this.addPlayerToMap(player, map, map.landingPoints.entry);
                
                }   
            
            }, this);
            
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
            
            var elementsToRemove = [];
                
            map.updates = null;
        
            _.each(map.heroes, function(hero) {
            
                Env.runEntity(hero, map);
            
            });
            
            _.each(map.creatures, function(creature) {
            
                Env.runEntity(creature, map);
            
            });
            
            elementsToRemove = [];
            
            _.each(map.projectiles, function(projectile) {
            
                if (projectile) {
            
                    Env.runProjectile(projectile, map);
                    
                    if (projectile.isDead) {
                    
                        elementsToRemove.push(projectile);
                    
                    }
                
                }
                              
            });
            
            if (elementsToRemove.length > 0) {
            
                Core.removeAll(elementsToRemove, map.projectiles);
            
            }
            
            // loop through all objects
            
            // check if we need to spawn something
            if (map.spawnPoints.length > 0) {
            
                _.each(map.spawnPoints, function(spawnPoint) {
                
                    if (spawnPoint.spawn && Core.inRangeOfAny(spawnPoint, map.heroes, 1000)) {
                    
                        this.spawn(map, spawnPoint);            
                    
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
        
            var updates = {};
            
            _.each(['heroes', 'lootables', 'creatures', 'projectiles', 'droppedItems'], function(key) {
            
                _.each(map[key], function(e) {
                
                    updates[e._id] = Entity.createUpdate(key, e, true); 
                
                });
            
            });
        
            return [
                map._id, 
                map.name, 
                map.level,
                map.grid, 
                map.width, 
                map.height, 
                map._width, 
                map._height, 
                updates
            ];
        
        }, 

// PRIVATE SECTION /////////////////////////////////////////////////////////////

        // add a player to a map and add the map reference to the player
        addPlayerToMap: function(player, map, landingPoint) {
        
            map.players.push(player);
            map.heroes.push(player.hero);
            
            player._map = map;
            player.hero._map = map;
        
            Core.setPosition(player.hero, landingPoint.x, landingPoint.y, map);
        
        }, 
        
        // spawn something
        spawn: function(map, spawnPoint) {

            // determine type: either the spawn point has a specific list 
            // of spawns, otherwise we fall back to the map-wide list 
            // then we randomly get an element from this list       
            var type = Core.randomElement(spawnPoint.spawn.types || map.spawnTypes), 
            
            // determine the rank object rank to spawn: if not set 
            // we always assume a 'normal' object (normal creature, normal
            // chest, etc)
                rank = spawnPoint.spawn.rank || F.NORMAL,
                x = spawnPoint.x, 
                y = spawnPoint.y,  
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
            
            spawnPoint.spawn = null;   
        
        
        }               
    
    };

};
"use strict";

module.exports = function(_, Map) {

    return {
    
        // list of all open games
        games: [], 
        
        /* CREATE
        *  create a new game
        */
        create: function(player, isPublic) {
        
            var game = {
                    players: [], 
                    isPublic: isPublic || false,
                    isPaused: true,  
                    tsStart: +new Date(), 
                    maps: []
                };

            // add the game to the list of active games
            this.games.push(game);
            
            return game;
        
        },
        
        /* JOIN
        *  add a player to a game
        */ 
        join: function(player, game) {
        
            // determine the players map id
            var mapId = 1;
        
            // add the player to the game
            game.players.push(player);
            
            // add the game to the player
            player._game = game;
            
            // let the player enter the map, the map module makes 
            // sure the map exists and sets the map reference on the 
            // player
            Map.enter(player, mapId, game.maps);
        
        },  
        
        /* LEAVE
        *  a player wants to leave a game
        *  remove the player from its game (if any)
        *  if the player was the last player in a game remove the game 
        *  altogether                
        */ 
        leave: function(player) {
        
            if (player._game) {
            
                this.removePlayerFromGame(player, player._game);
            
            }
        
        },
        
        /* TRANSPORTIZE
        *  prepare the game object for transportation via WebSocket
        */                                
        transportize: function(game, player) {
        
            return [
                _.pluck(game.players, '_id'), 
                game.isPublic ? 1 : 0, 
                game.isPaused ? 1 : 0, 
                game.tsStart
            ];
        
        }, 
        
        /* RUN - SERVER-SIDE PER-GAME GAME LOOP
        *  this is called per game once every server-side game loop
        *  walk through all maps and run all entities through the core loop
        */
        run: function(game) {
        
            // only in an active game stuff happens
            if (!game.isPaused) {
            
                // walk through all maps and pass to the core loop
                _.each(game.maps, Map.run);
                    
            }    
        
        },         
    
// PRIVATE SECTION /////////////////////////////////////////////////////////////

        /* REMOVEPLAYERFROMGAME
        *  remove a player from an open game
        *  if it is the only player in the game -> remove the game       
        */        
        removePlayerFromGame: function(player, game) {
        
            // remove the player from the player list of the game
            game.players = game.players.filter(function(i) { return i !== player; });
            // unset the game reference on the player
            player._game = null;
            
            if (game.players.length == 0) {
            
                this.remove(game);
            
            }
        
        }, 
        
        /* REMOVE
        *  remove a game completely
        */        
        remove: function(game) {
        
            this.games = this.games.filter(function(i) { return i !== game; });
        
        }
          
    
    };

};
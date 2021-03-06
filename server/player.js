"use strict";

module.exports = function(_, fs, F, Core, Settings, Entity) {

    return {
    
        // the list of active players
        // contains all currently logged in players inside and outside of 
        // games
        players: [], 

        /* LOGIN
        *  authenticate a player by name and password
        *  if this works try to load the player object       
        */        
        login: function(playername, password) {
    
            // TODO: handle authentication stuff first
            return this.load(playername);
        
        },  
    
        /* LOGOUT
        *  remove the player from the active player list
        */        
        logout: function(player) {
         
            // remove the player from the active player list
            this.players = this.players.filter(function(e) { return e !== player; });
        
        },  
    
        /* BYID
        *  return a player by id
        */        
        byId: function(id) {
        
            return _.find(this.players, function(player) { return player._id == id });
        
        }, 
    
        /* LOAD (SINGLETON)
        *  returns the player by its name either by loading it from the data 
        *  store or from the list of players
        */        
        load: function(playername) {
        
            // first try to load the player from the list of active players
            var player = this.getPlayerByName(playername);
            
            // the player is not logged in yet
            if (!player) {
            
                // load the player from the datastore
                player = require(this.getPlayerFilename(playername));
                
                // create the hero character from the stored data
                player.hero = Entity.createCharacter(Core.clone(player.heroData));
                player.hero.balance = player.balance;
                
                // setup stuff when creating a new player
                // TODO: handle this in the create method
                if (!player.spaces) {
                
                    player.spaces = {
                        inventory: Core.createSpace(F.INVENTORY, Settings.inventory_dimensions), 
                        stash0: Core.createSpace(F.STASH0, Settings.stash_dimensions)
                    };
                                
                }
                
                // add the player to the list of active players
                this.players.push(player);
            
            }
        
            return player;
        
        }, 
    
        /* TRANSPORTIZE
        *  prepare the player object for transportation via WebSocket
        */        
        transportize: function(player) {
        
            return [player.id, player.name, player.hero, player.balance, player.buddies];
        
        }, 
    
        /* SAVE
        *  write the player object to the data store
        */        
        save: function(player) {
        
            var filename = this.getPlayerFilename(player.name), 
                content = player;
        
            fs.writeFile(filename, content, Core.errorHandlerLog);
        
        }, 
        
// PRIVATE SECTION /////////////////////////////////////////////////////////////
    
        /* GETPLAYERBYNAME
        *  returns a player by its name if it can be found in the active 
        *  player list
        */
        getPlayerByName: function(playername) {
        
            return _.find(this.players, function(i) { return i.name == playername; });
        
        }, 
        
        /* GETPLAYERFILENAME
        *  returns the path to the players file
        */
        getPlayerFilename: function(playername) {
        
            return './../store/players/' + playername + '.json'
        
        }        
    
    };
    
};
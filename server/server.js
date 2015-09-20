"use strict";

module.exports = function(io, _, Player, Game, Map, Env, Entity) {

    return {

        // the current version of the server
        // completely useless at the moment, but fun to have
        // is however returned to the client upon handshake
        version: '0.1-a', 

        // the events the server reacts upon, all others are ignored
        events: ['login', 'logout', 'disconnect', 'status', 'gameCreate', 
            'gameJoin', 'mapLoaded', 'gameLeave', 'input'],  

// EXTERNALIZED EVENTS /////////////////////////////////////////////////////////
// methods in this section can be called by the client /////////////////////////

        /* LOGOUT 
        *  logs out the player
        *  the player is removed from its active game and removed from 
        *  the active player list. the player is not visible to the 
        *  system anymore                        
        */
        logout: function(event, socket, data) {
        
            if (socket._player) {
        
                // make sure to remove the player from any open games
                Game.leave(socket._player);
            
                // remove the player
                Player.logout(socket._player);  
            
                // send a status update to all connected players 
                this.updateStatus();
            
            }
        
        }, 
    
        /* DISCONNECT
        *  the client was disconnected due to a network issue or more likely 
        *  because the client closed the browser window
        *  as server we interpret this as a logout                
        */        
        disconnect: function(event, socket, data) {
        
            this.logout(event, socket, data);
        
        },

        /* LOGIN
        *  the client wants to login and passes us its username and 
        *  password
        *  we delegate to the Player module which handles authentication 
        *  and in case of success returns us a player object
        *  we two-way-bind the player to the socket connection and 
        *  deliver it back to the client                                 
        */        
        login: function(event, socket, data) {
        
            // delegate authentication and loading to the player module
            var player = Player.login(data.playername, data.password);
            
            // the player was authenticated and loaded successfully
            if (player) {
            
                // 2-way bind the socket to the player
                player._socket = socket;
                socket._player = player;
                
                // send the player object back to the client
                socket.emit(event, Player.transportize(player)); 
                
                // send a status update to all connected players 
                this.updateStatus();
            
            } 
            // we could not authenticate the player (wrong username or password)
            // or we could not load the player for some reason
            else {
            
                socket.emit('error', 'AUTH_FAILED');
            
            }
        
        },
        
        /* STATUS
        *  returns a status update to the client
        *  the status consists of
        *  - amount of active players
        *  - amount of open games                        
        */        
        status: function(event, socket, data) {
        
            this.updateStatus(socket);
        
        },
        
        /* GAMECREATE
        *  the client wants to create a new game
        */         
        gameCreate: function(event, socket, data) {
        
            // create a new game 
            var game = Game.create(socket._player, data.isPublic);
            
            // send a status update to all connected players
            this.updateStatus();    
            
            // during game creation we automatically perform a join
            Game.join(socket._player, game);
            
            // send the game object to the client
            socket.emit(event, Game.transportize(socket._player._game)); 
            
            // then send the map object to the client
            socket.emit('map', Map.transportize(socket._player._map));         
        
        }, 
        
        /* MAPLOADED
        *  the client informs us that they have loaded the map and 
        *  have resumed their game loop
        */
        mapLoaded: function(event, socket, data) {
            
            var update = {};
            
            update[socket._player.hero._id] = {
                x: socket._player.hero.x, 
                y: socket._player.hero.y, 
                z: socket._player.hero.z
            };
                
            // activate the game
            socket._player._game.isPaused = false;

            socket.emit('updates', update);
        
        },
        
        /* INPUT
        *  we handle an input (click, keypress) from the client
        */
        input: function(event, socket, data) {
        
            // let's store the input on the hero entity so we can 
            // process it in the next loop
            // data contains key, x, y
            socket._player.hero._inputs.unshift(data);
        
        },                          
        
// PRIVATE SECTION /////////////////////////////////////////////////////////////

        // the timestamp of a loop start
        tsLoopStart: null, 
        
        // here we store our loopTimeSampleCount samples
        loopTimeSamples: [], 
        
        // how many samples should we produce?
        loopTimeSampleCount: 100, 
        
        // here we count our server loops
        loopCount: 0, 
        
        // the timestamp of the last loop
        tsLastLoopStart: 0, 
        
        // the time in ms we wait before starting a new loop
        // let's do 10fps at the beginning [fps = 1000 / msLoop]
        msLoop: 100,  

        /* UPDATE STATUS
        *  creates a status object and returns to either a passed socket or 
        *  all connected sockets        
        */        
        updateStatus: function(target) {
        
            var target = target || io.sockets;
        
            target.emit('status', [
                Player.players.length, 
                Game.games.length, 
                (_.reduce(this.loopTimeSamples, function(num, i) { return num + i; }, 0) / this.loopTimeSamples.length).toFixed(2) 
            ]);
        
        },         
        
        /* RUN - SERVER-SIDE GAME LOOP
        *  here we run through all open games and 
        *  invoke their loops 
        */        
        run: function() {
        
            var that = this;
        
            // sample the start timestamp
            this.tsLoopStart = +new Date();
        
            // make sure we waited long enough
            if (this.tsLastLoopStart + this.msLoop < this.tsLoopStart) {
            
                Env.setTicks(this.tsLoopStart - this.tsLastLoopStart);
                            
                // remember this (active) loop start timestamp
                this.tsLastLoopStart = this.tsLoopStart;
            
                // walk through all games and invoke loop
                // there shouldn't be too many games in the beginning so we dont't
                // care _.each is more expansive than a loop
                _.each(Game.games, Game.run);
            
                // store how long it took us to perform this loop
                this.loopTimeSamples[this.loopCount % this.loopTimeSampleCount] = (+new Date() - this.tsLoopStart);
                
                // one more active looop, yay!
                this.loopCount++;
            
            }
            
            // rinse and repeat
            setTimeout(function() { that.run() });
        
        }
    
    }

};

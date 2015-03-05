"use strict";

(function() {

    if (typeof _ === 'undefined') {
    
        if (typeof require !== 'undefined') {
    
            var _ = require('../js/underscore.min.js');
            var fs = require('fs');
            var Core = require('../js/shared/core.js');
            var F = Core.Flags;            
            var Utils = Core.Utils;
        
        } else if (this._) {
        
            var _ = this._;
        
        }
    
    } 
    
    var Server = { 

        version: '1.0',
        
        tsLastLoop: 0, 
        
        msFrame: 16.6, 
        
        // active games
        games: [],
        
        // logged-in players
        players: [],
        
        // the debug socket, if connected
        debug: null,
        
        // the droptables
        settings: null, 
        
        // incrementing number used for game ids
        gamesSequenceNo: 0, 
        
        debugInfo: function() {
    
            if (this.debug) {
    
                this.debug.emit('info', { players: this.players.length, games: this.games.length });
            
            }
        
        }, 
        
        lobbyInfo: function() {
    
            _.each(this.players, function(e) {
            
                e.socket.emit('gamelist', this.gamelist(e.socket));
                e.socket.emit('buddylist', this.buddylist(e.socket));
            
            }, this);
        
        }, 
        
        createItem: function(itemType, sourceLevel, magicFind, goldFind) {
        
            var item = null, 
                blueprints, blueprint;
            
            // let's grab all possible blueprints
            blueprints = _.filter(this.settings.blueprints, function(bp) { 
            
                return bp[1] <= sourceLevel && 
                       bp[2] >= sourceLevel && 
                       bp[4].indexOf(itemType) != -1; 
            
            });
            
            if (blueprints.length > 0) {
            
                // get a random one from the list of blueprints 
                // we want the whole entry back and use the value 
                // behind index 3 as probability
                blueprint = Utils.randomA(blueprints, true, 3); 
                
                if (blueprint) {
                
                    item = [
                        // flags
                        blueprint[4], 
                        // settings
                        blueprint[6]
                    ]; 
                    
                    switch (itemType) {
                    
                        case F.GOLD: 
                    
                            // create a gold drop
                            // the amount will be somewhere between the source's level and 
                            // the source's level square + 1
                            // i.e: level 1 sources drop between 1 and 2    
                            //      level 99 sources drop between 99 and 9802
                            // the result is multiplied by the goldFind value which is 
                            // always at least 1                    
                            item[1].amount = Utils.randomInt(sourceLevel, sourceLevel * sourceLevel + 1) * goldFind;
    
                            break;
                    
                    }       
                
                }   
            
            }  
            
            return item;        
        
        }, 
        
        drop: function(source, magicFind, goldFind) {
        
            // create a drop based on source droptable and player level, 
            // gold find and magic find 
            var dropTable = this.settings.droptables[source.droptable] || this.settings.droptables.default, 
                amount = Utils.randomA(dropTable.amount), 
                drop = [], itemType, item, i;
            
            // if we encountered a null-drop, we don't do anything
            // otherwise we request [amount] items based on the droptable
            if (amount > 0) {       
            
                for (i = 0; i < amount; i++) {
                
                    // get a random item type, probabilities are 
                    // set in the droptable
                    itemType = Utils.randomA(dropTable.items);
                
                    item = this.createItem(
                        // the item type
                        Utils.randomA(dropTable.items), 
                        // the source level
                        source.level || 1, 
                        // magic find
                        magicFind || 1, 
                        // gold find
                        goldFind || 1                 
                    );
                
                    // make sure an item was created; based on the level
                    // requirements and itemType the creation can 
                    // fail
                    if (item) {

                        drop.push(item);
                    
                    }
                
                }
            
            }  
            
            return drop; 
        
        }, 
        
        login: function(socket, playername, password) {
           
            var player;
        
            try {
            
                player = require('./../store/players/' + playername + '.json');
                
                socket.player = player;
                player.socket = socket;
                
                // temp player-specific items
                player.items = {
                    vendors: {}, 
                    drops: {}
                };
                
                this.players.push(player);
    
                this.debugInfo(); 
                
                this.lobbyInfo();
                
                return {
                    id: player.id, 
                    name: player.name, 
                    hero: player.hero
                };
            
            } catch (err) {
              
                console.dir(err);
    
                return {};
            
            }    
        
        }, 
        
        logout: function(socket) {
        
            // end game if necessary
            if (socket.gameId > 0) {
            
                this.leaveGame(socket);
            
            }
            
            // remove player        
            this.players = _.without(this.players, socket.player);
            
            // unregister debug socket
            if (socket == this.debug) {
            
                this.debug = null;
            
            } else {
            
                this.debugInfo(); 
            
            }
    
        }, 
        
        gamelist: function(socket, data) {
        
            return _.map(this.games, function(e) { return { id: e.id, name: e.name, players: e.players.length } });                
        
        },
        
        buddylist: function(socket, data) {
        
            var list = [];
            
            if (socket.player) {
            
                _.each(socket.player.buddies, function(e) {
                
                    var player = this.player(e.id) || null, 
                        game; 
                
                    if (player) {
                    
                        game = this.gameByPlayer(player.id);
                    
                    }
                
                    list.push({ id: e.id, name: player != null ? player.name : e.name, online: player != null, gameId: game ? game.id : 0 });
                
                }, this);
            
            }
            
            return _.sortBy(list, function(e) { return (e.gameId) + (e.online ? 1 : 0); });
        
        },  
        
        createGame: function(socket, data) {
        
            var id = ++this.gamesSequenceNo;
            
            // add a new game to the list
            this.games.push({ 
                id: id, 
                name: 'Game #' + id, 
                players: [], 
                state: this.createGameState(data)  
            });
            
            // join the new game
            return this.joinGame(socket, { gameId: id });
        
        },
        
        joinGame: function(socket, data) {
        
            var gameId, game;
            
            if (data.playerId) {
            
                gameId = this.player(data.playerId).gameId;    
            
            } else {
            
                gameId = data.gameId;
            
            }
            
            game = this.game(gameId);
            
            // add the player to the game's player list
            game.players.push(socket.player);
            
            // bind the socket to the current game id
            socket.gameId = game.id;
            
            this.debugInfo(); 
            
            this.lobbyInfo();
            
            // return the current game state
            return game.state.maps.playground.state;
        
        }, 
        
        // the client has loaded everything, we can now add him to the 
        // game
        onClientGameLoaded: function(socket, data) {
        
            this.addElement(socket.gameId, socket.player.hero);
        
        }, 
        
        // add an element to a game state and inform everyone about it
        addElement: function(gameId, element) {
        
            var game = this.game(gameId);
            
            game.state.elements.push(element);
            
            this.broadcast(_.pluck(game.players, 'socket'), 'createelement', element);
        
        }, 
        
        broadcast: function(socketlist, msg, data) {
        
            _.each(socketlist, function(e) {
            
                e.emit(msg, data);
            
            });
        
        }, 
        
        game: function(id) {
        
            return _.find(this.games, function(e) { return e.id == id; });
        
        }, 
        
        gameByPlayer: function(playerId) {
        
            return _.find(this.games, function(e) { return _.find(e.players, function(e) { return e.id == playerId }); }, this);
        
        }, 
        
        player: function(id) {
        
            return _.find(this.players, function(e) { return e.id == id; });
        
        }, 
        
        createGameState: function(data) {
        
            var gameState = { 
                    maps: {
                        'playground': {
                            state: {
                                elements: [], 
                                map: { 
                                    id: 'playground', 
                                    assetId: 'map-playground', 
                                    reqAssets: ['desert.png'],
                                    theme: 'desert.png', 
                                    width: 6400, 
                                    height: 3200,  
                                    grid: {
                                        rows: 100, 
                                        cols: 100, 
                                        tiles: []
                                    } 
                                }
                            }
                        }
                    } 
                }, 
                i, j;
        
            for (i = 0; i < gameState.maps.playground.state.map.grid.cols; i++) {
            
                for (j = 0; j < gameState.maps.playground.state.map.grid.rows; j++) {
                
                    gameState.maps.playground.state.map.grid.tiles.push({ name: i + '_' + j, walkable: true });
                
                }
            
            }
            
            return gameState;
        
        }, 
        
        leaveGame: function(socket, data) {
        
            this.removePlayerFromGame(socket.gameId, socket.player.id);
        
        }, 
        
        removePlayerFromGame: function(gameId, playerId) {
        
            var game = this.game(gameId), 
                player = this.player(playerId), 
                i;
            
            if (game && player) {
            
                game.state.elements = _.without(game.state.elements, player.hero);
                
                game.players = _.without(game.players, player);
                
                if (game.players.length == 0) {
                
                    this.games = _.without(this.games, game); 
                    
                    this.debugInfo(); 
                    
                    this.lobbyInfo();       
                
                }
            
            }
    
        }, 
        
        init: function() {
        
            // load the droptables
            this.settings = require('./../store/settings.json');
            
            // pre-process the droptables
            _.each(this.settings.droptables, function(dt) {
            
                _.each(dt.items, function(dti) {
    
                    dti[0] = F[dti[0].toUpperCase()];
                
                }, this);
            
            }, this);
            
            // pre-process the blueprints
            _.each(this.settings.blueprints, function(bp) {
            
                for (var i = 0; i < bp[4].length; i++) {
                
                    bp[4][i] = F[bp[4][i].toUpperCase()];
                
                }
            
            }, this);
            
            // start server loop    
            this.run();
        
        }, 
        
        run: function() {
        
            var ts = +new Date(), 
                that = this;
            
            if (this.tsLastLoop + this.msFrame < ts) {
            
                this.tsLastLoop = ts;
                
                _.each(this.games, this.update, this);
                
                this.autoSavePlayers();
            
            }
            
            setTimeout(function() { that.run(); });
        
        }, 
        
        update: function(game) {
        
            var ts = +new Date();
            
            // handle everything
            // e.g. produce a new game state
            
        }, 
        
        autoSavePlayers: function() {
        
            var ts = +new Date();
            
            _.each(this.players, function(e) {
            
                if (ts - (e.socket.tsLastSaved || 0) > this.msAutoSave) {
                
                    fs.writeFile('./../store/players/' + e.playername + '.json', JSON.stringify(e.player), function(err) {}); 
                    
                    e.socket.tsLastSaved = ts;   
                
                }
            
            }, this);
        
        }
             
    }
    
    if (typeof module !== 'undefined') {
    
        module.exports = Server;
    
    } else {
    
        window.Server = Server;
    
    }

}).call(this);
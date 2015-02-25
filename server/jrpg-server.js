"use strict";

module.exports = {

    _fs: require('fs'), 
    _: require('../js/underscore.min.js'),

    version: '1.0',
    
    tsLastLoop: 0, 
    
    msFrame: 16.6, 
    
    // active games
    games: [],
    
    // logged-in players
    players: [],
    
    // the debug socket, if connected
    debug: null,  
    
    // incrementing number used for game ids
    gamesSequenceNo: 0, 
    
    debugInfo: function() {

        if (this.debug) {

            this.debug.emit('info', { players: this.players.length, games: this.games.length });
        
        }
    
    }, 
    
    lobbyInfo: function() {

        this._.each(this.players, function(e) {
        
            e.socket.emit('gamelist', this.gamelist(e.socket));
            e.socket.emit('buddylist', this.buddylist(e.socket));
        
        }, this);
    
    }, 
    
    login: function(socket, playername, password) {
       
        var player;
    
        try {
        
            player = require('./../store/players/' + playername + '.json');
            
            socket.player = player;
            player.socket = socket;
            
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
        this.players = this._.without(this.players, socket.player);
        
        // unregister debug socket
        if (socket == this.debug) {
        
            this.debug = null;
        
        } else {
        
            this.debugInfo(); 
        
        }

    }, 
    
    gamelist: function(socket, data) {
    
        return this._.map(this.games, function(e) { return { id: e.id, name: e.name, players: e.players.length } });                
    
    },
    
    buddylist: function(socket, data) {
    
        var list = [];
        
        if (socket.player) {
        
            this._.each(socket.player.buddies, function(e) {
            
                var player = this.player(e.id) || null, 
                    game; 
            
                if (player) {
                
                    game = this.gameByPlayer(player.id);
                
                }
            
                list.push({ id: e.id, name: player != null ? player.name : e.name, online: player != null, gameId: game ? game.id : 0 });
            
            }, this);
        
        }
        
        return this._.sortBy(list, function(e) { return (e.gameId) + (e.online ? 1 : 0); });
    
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
        return game.state;
    
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
        
        this.broadcast(this._.pluck(game.players, 'socket'), 'createelement', element);
    
    }, 
    
    broadcast: function(socketlist, msg, data) {
    
        this._.each(socketlist, function(e) {
        
            e.emit(msg, data);
        
        });
    
    }, 
    
    game: function(id) {
    
        return this._.find(this.games, function(e) { return e.id == id; });
    
    }, 
    
    gameByPlayer: function(playerId) {
    
        return this._.find(this.games, function(e) { return this._.find(e.players, function(e) { return e.id == playerId }); }, this);
    
    }, 
    
    player: function(id) {
    
        return this._.find(this.players, function(e) { return e.id == id; });
    
    }, 
    
    createGameState: function(data) {
    
        var gameState = { 
                elements: [], 
                map: { 
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
            }, 
            i, j;
    
        for (i = 0; i < gameState.map.grid.cols; i++) {
        
            for (j = 0; j < gameState.map.grid.rows; j++) {
            
                gameState.map.grid.tiles.push({ name: i + '_' + j, walkable: true });
            
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
        
        game.state.elements = this._.without(game.state.elements, player.hero);
        
        game.players = this._.without(game.players, player);
        
        if (game.players.length == 0) {
        
            this.games = this._.without(this.games, game); 
            
            this.debugInfo();        
        
        }

    }, 
    
    run: function() {
    
        var ts = +new Date(), 
            that = this;
        
        if (this.tsLastLoop + this.msFrame < ts) {
        
            this.tsLastLoop = ts;
            
            this._.each(this.games, this.update, this);
            
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
        
        this._.each(this.players, function(e) {
        
            if (ts - (e.socket.tsLastSaved || 0) > this.msAutoSave) {
            
                this._fs.writeFile('./../store/players/' + e.playername + '.json', JSON.stringify(e.player), function(err) {}); 
                
                e.socket.tsLastSaved = ts;   
            
            }
        
        }, this);
    
    }
         
}
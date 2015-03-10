"use strict";

(function() {

    if (typeof _ === 'undefined') {
    
        if (typeof require !== 'undefined') {
    
            var _ = require('../js/underscore.min.js');
            var fs = require('fs');
            var Core = require('../js/shared/core.js'); 
        
        } else if (this._) {
            
            var _ = this._;
            var Core = this.Core;
        
        }
        
        var Utils = Core.Utils;
        var F = Core.Flags;
        var K = [];
        
        _.each(F, function(value, key) {
            
            K[value] = key;
        
        });       
        
    
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
        
        // incrementing number used for game ids
        gamesSequenceNo: 0, 
        
        // auto-increment id
        _id: 0, 
        
        // get a new id
        // TODO: change this to a persistent one
        id: function() {
        
            return ++this._id;
        
        }, 
        
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
        
        randomName: function(item) {
        
            return Utils.randomA(['Vile', 'Evil', 'Azure', 'Cobalt', 'Mirror', 'Soul', 'Meat', 'Flesh', 'Skin', 'Moon', 'Sun', 'Neptune', 'Mars', 'Mercury', 'Venus', 'Earth', 'Jupiter', 'Saturn', 'Uranus']) + ' ' + 
                   Utils.randomA(['Cutter', 'Knife', 'Shard', 'Edge', 'Steel', 'Point', 'Blade', 'Sabre', 'Shiv', 'Dagger', 'Ripper']);
        
        }, 
        
        // get a random blueprint based on the item type and source level
        randomBlueprint: function(itemType, level) {
        
            return Utils.randomP(_.filter(Core.Settings.blueprints, function(i) {
            
                return i[1] <= level && i[2] >= level && i[4].indexOf(itemType) != -1;
            
            }), 3);
        
        }, 
        
        createItem: function(itemType, sourceLevel, magicFind, goldFind, blueprint) {
        
            var blueprint = blueprint || this.randomBlueprint(itemType, sourceLevel), 
                item = null, 
                rank, quality;
          
            if (blueprint) {
            
                item = [
                    // id
                    this.id(), 
                    // flags
                    blueprint[4].slice(), 
                    // settings
                    $.extend({}, true, blueprint[6]),
                    // level
                    sourceLevel
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
                        item[2].amount = Utils.randomInt(sourceLevel, sourceLevel * sourceLevel + 1) * goldFind;
                        
                        break;
                    
                    case F.WEAPON:
                    case F.ARMOR:
                    case F.JEWELRY:
                  
                        // create an equipment drop
                        // first calculate the rank
                        // randomD returns [rankKey, rank]
                        rank = rank || Utils.randomL(Core.Settings.itemRanks, sourceLevel, 1, 2, 3);

                        // store the item's rank
                        item[1].push(rank[0]);

                        switch (rank[0]) {
                        
                            case F.RARE:
                            
                                this.addAffixes(item, Utils.randomP(rank[4], 1)[0]);
                                
                                item[2].name = this.randomName(item);
                                
                                break;
                        
                            case F.MAGIC: 
                            
                                this.addAffixes(item, Utils.randomP(rank[4], 1)[0]);
                                
                                item[2].name = item[2].name.replace('#', blueprint[0]);
                            
                                break;
                        
                            case F.NORMAL: 
                            
                                // quality
                                quality = Utils.randomL(Core.Settings.itemQualities, sourceLevel, 1, 2, 3);

                                item[1].push(quality[0]);
                                
                                this.changeAttribsByQuality(item, quality[4]);
                                
                                // sockets
                                this.addSockets(item);                             
                            
                                break;
                        
                        }

                        break;     
                
                }    
            
            }
            
            return item;
        
        }, 
        
        // return a random affix from a list of affixes
        // the method checks if the affix level corresponds to the item 
        // level and if the affix is not already set on the item
        randomAffix: function(item, affixes) {
        
            return Utils.randomL2(_.filter(affixes, function(a) {
            
                return !(item[2].affixes && item[2].affixes[a[5]]);
            
            }), item[3], item[1], 0, 1, 2, 3);
        
        }, 
        
        addPrefix: function(item, multiplier) {
        
            var prefix = this.randomAffix(item, Core.Settings.affixes.prefixes);
            
            item[2].name = prefix[4] + ' #';
            
            this.addAffix(item, prefix, multiplier);
        
        }, 
        
        addSuffix: function(item, multiplier) {
        
            var suffix = this.randomAffix(item, Core.Settings.affixes.suffixes);
            
            item[2].name = (item[2].name || '#') + ' ' + suffix[4];
            
            this.addAffix(item, suffix, multiplier);
        
        }, 
        
        addAffix: function(item, affix, multiplier) {
        
            var affix = affix || this.randomAffix(item, [].concat(Core.Settings.affixes.prefixes, Core.Settings.affixes.suffixes)),  
                multiplier = multiplier || 1, 
                value = Math.max(1, Utils.randomInt(affix[6][0], affix[6][1]));

            if (!item[2].affixes) {
            
                item[2].affixes = {};    
            
            }
            
            if (affix[5] == 'sockets') {
            
                if (this.addSockets(item, value)) {
                
                    item[2].affixes[affix[5]] = value;    
                
                }   
            
            } else {
            
                // assign the affix with a random value within the affix min/max
                // range, the affix value cannot be lower than 1
                item[2].affixes[affix[5]] = value * multiplier;
            
            }

        }, 
        
        addAffixes: function(item, affixCount) {

            var i;

            if (affixCount == 1) {
            
                if (Math.random() > 0.5) {
                
                    this.addPrefix(item);
                
                } else {
                
                    this.addSuffix(item);
                
                }
            
            } else if (affixCount > 1) {
            
                this.addPrefix(item);
                this.addSuffix(item);
                
                // add the rest of the affixes
                if (affixCount > 2) {
                
                    for (i = 2; i < affixCount; i++) {
                    
                        this.addAffix(item);
                    
                    }
                
                }   
            
            }                    
        
        }, 
        
        changeAttr: function(item, attr, multiplier) {
        
            item[2][attr] = Math.max(1, item[2][attr] * multiplier);
        
        }, 
        
        changeAttribsByQuality: function(item, multiplier) {
        
            if (Utils.is(item, F.WEAPON)) {
            
                this.changeAttr(item, 'minDmg', multiplier);
                this.changeAttr(item, 'maxDmg', multiplier);
            
            } else {
            
                this.changeAttr(item, 'armor', multiplier);    
            
            }
        
        }, 
        
        addSockets : function(item, socketCount) {
        
            var maxSockets = Utils.maxSockets(item), 
                socketCount = socketCount || Utils.randomInt(Utils.blueprint(item[1])[7].sockets), 
                i;

            // make sure we
            // - add at least one socket
            // - dont add more sockets we're allowed to do
            if (socketCount > 0 && (item[2].sockets || []).length + socketCount <= maxSockets) {
            
                if (!Utils.is(item, F.SOCKETED)) {
                
                    item[1].push(F.SOCKETED);
                    item[2].sockets = [];
                
                }
                
                for (i = 0; i < socketCount; i++) {
                                        
                    item[2].sockets.push(null);
                                        
                }    
                
                return true;                   
            
            }               
            
            return false;            
        
        }, 
        
        drop: function(source, magicFind, goldFind) {
           
            // create a drop based on source droptable and player level, 
            // gold find and magic find 
            var dropTable = Core.Settings.droptables[source.droptable] || Core.Settings.droptables.default, 
                amount = Utils.randomP(dropTable.amount, 1)[0], 
                drop = [], item, i;
            
            // if we encountered a null-drop, we don't do anything
            // otherwise we request [amount] items based on the droptable
            if (amount > 0) {       
            
                for (i = 0; i < amount; i++) {

                    // get a random item type, probabilities are 
                    // set in the droptable
                    item = this.createItem(
                        // the item type
                        Utils.randomP(dropTable.items, 1)[0], 
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
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
        
        msFrame: 1000, 
        
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
        
            return Utils.randomA(Core.Settings.rareNames1) + ' ' + 
                   Utils.randomA(Core.Settings.rareNames2);
        
        }, 
        
        // get a random blueprint based on the item type and source level
        randomBlueprint: function(itemType, level) {
        
            return Utils.randomP(_.filter(Core.Settings.blueprints, function(i) {
            
                return i[1] <= level && i[2] >= level && i[4].indexOf(itemType) != -1;
            
            }), 3);
        
        }, 
        
        createDistinctItem: function(blueprintFlag, level, rank, quality) {
        
            var blueprint = Utils.blueprintBySingleFlag(blueprintFlag), 
                itemType = Utils.itemTypeByBlueprint(blueprint), 
                level = level || 1, 
                rank = Utils.rank(rank || F.NORMAL), 
                quality = Utils.quality(quality || F.STANDARD); 

            return this.createItem(itemType, level, 0, 0, blueprint, rank, quality);
        
        }, 
        
        createItem: function(itemType, sourceLevel, magicFind, goldFind, blueprint, rank, quality) {
        
            var blueprint = blueprint || this.randomBlueprint(itemType, sourceLevel), 
                item = null;
          
            if (blueprint) {
            
                item = [
                    // id
                    this.id(), 
                    // flags
                    blueprint[4].slice(), 
                    // settings
                    _.extend({}, blueprint[6]),
                    // level
                    sourceLevel,
                    // location
                    [F.DROP]
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
                
                item[2].c = {};
                item[2].levelReq = item[2].c.levelReq = sourceLevel;
                
                if (item[2].minDmg) {
                
                    item[2].c.minDmg = item[2].minDmg;
                    item[2].c.maxDmg = item[2].maxDmg;
                    item[2].c.as = item[2].as;
                    item[2].c.dps = (item[2].c.minDmg + item[2].c.maxDmg) / 2 * item[2].c.as;
                
                } else if (item[2].armor) {
                
                    item[2].c.armor = item[2].armor;
                
                }
                
                if (item[2].durability) {
                
                    item[2].c.durability = item[2].durability;
                
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
        
        createDrop: function(source, magicFind, goldFind) {
           
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
        
        createAndAddItem: function(socket, blueprintFlag) {
        
            var item = this.createDistinctItem(blueprintFlag);
            
            // add item to the players item list
            socket.player.items.push(item);
            
            return item;
        
        }, 
        
        createAndEquipItem: function(socket, blueprintFlag, slotHint) {
        
            var item = this.createAndAddItem(socket, blueprintFlag);
    
            // put the item into the players hand
            this.grab(socket, item[0]);
            
            // try to equip the item
            this.equip(socket, item[0], slotHint);    
        
        }, 
        
        createAndStoreItem: function(socket, spaceKey, blueprintFlag) {
        
            var item = this.createAndAddItem(socket, blueprintFlag);
            
            // put the item into the players hand
            this.grab(socket, item[0]);
            
            // put the item into a space
            this.putToSpace(socket, spaceKey);         
        
        }, 
        
        login: function(socket, playername, password) {
           
            var player = require('./../store/players/' + playername + '.json');
                
            socket.player = player;
            player.socket = socket;
            player.hero.equipment = [];
            player.hero.flags = [F.HERO];
            
            // clear everything - just to make sure
            this.removePlayerFromGames(player.id);
            
            // setup spaces (inventory, stash, etc)
            player.spaces = {
                inventory: [F.INVENTORY].concat(Core.Settings.settings.inventory_dimensions),
                stash0: [F.STASH0].concat(Core.Settings.settings.stash_dimensions), 
                stash1: [F.STASH1].concat(Core.Settings.settings.stash_dimensions), 
                stash2: [F.STASH2].concat(Core.Settings.settings.stash_dimensions), 
                stash3: [F.STASH3].concat(Core.Settings.settings.stash_dimensions)         
            };
            
            _.each(player.spaces, function(i) {
            
                this.createGrid(player, i);
            
            }, this);
            
            // we have a new player, let's add a knife and a healthpotion
            if (player.hero.xp == 0) {
            
                player.items = [];
                this.createAndEquipItem(socket, F.SMALLSWORD, F.WEAPON1);
                this.createAndStoreItem(socket, 'inventory', F.HEALTHPOTION);             
            
            }
            
            Core.prepareElement(player.hero);
            
            this.players.push(player);

            this.debugInfo(); 
            
            this.lobbyInfo();
            
            return {
                id: player.id, 
                name: player.name, 
                hero: player.hero, 
                balance: player.balance, 
                items: player.items
            };
        
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
            
            // bind the socket to the current map id
            socket.mapId = 'playground';
            
            // add the player also to the map's player list
            this.map(socket.gameId, socket.mapId).players.push(socket.player);
            
            this.debugInfo(); 
            
            this.lobbyInfo();
            
            // return the current game state
            return game.state.maps.playground.state;
        
        }, 
        
        map: function(gameId, mapId) {
        
            return this.game(gameId).state.maps[mapId];
        
        }, 
        
        landingPoint: function(gameId, mapId) {
        
            return this.map(gameId, mapId).landingPoints[0];
        
        }, 
        
        // the client has loaded everything, we can now add him to the 
        // game
        onClientGameLoaded: function(socket, data) {
        
            // place the hero on the landing point of the map
            var landingPoint = this.landingPoint(socket.gameId, socket.mapId);
            
            Core.Position.update(socket.player.hero, landingPoint[0], landingPoint[1]); 

            this.addElement(socket.gameId, socket.mapId, socket.player.hero);
        
        },
        
        // add an element to a game state and inform everyone about it
        addElement: function(gameId, mapId, element) {
        
            var game = this.game(gameId);
            
            game.state.maps[mapId].state.elements.push(element);
            
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
        
        removePlayerFromGames: function(playerId) {
        
            _.each(_.filter(this.games, function(e) { return _.find(e.players, function(e) { return e.id == playerId }); }, this), function(e) {
            
                this.removePlayerFromGame(e.id, playerId);
            
            }, this);
        
        },  
        
        player: function(id) {
        
            return _.find(this.players, function(e) { return e.id == id; });
        
        }, 
        
        createGameState: function(data) {
        
            var gameState = { 
                    maps: {
                        'playground': {
                            landingPoints: [], 
                            spawnPoints: [], 
                            players: [],  
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
                                        rows: 50, 
                                        cols: 50, 
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
                
                    gameState.maps.playground.state.map.grid.tiles.push([i, j, j * 10, i * 10, [F.WALKABLE, F.GROUND], {}]);
                
                }
            
            }
            
            gameState.maps.playground.landingPoints.push([100, 100]);
            gameState.maps.playground.spawnPoints.push([300, 300, F.HYSTRIX, 5]);
            
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
                
                _.each(game.state.maps, function(map) {
                
                    map.players = _.without(map.players, player);
                
                });
                
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
                
                //this.autoSavePlayers();
            
            }
            
            setTimeout(function() { that.run(); });
        
        }, 
        
        update: function(game) {
        
            var ts = +new Date(), 
                changes, hero;
            
            // go through all maps and update them
            _.each(game.state.maps, function(map, mapId) {

                // we skip empty maps
                if (map.players.length > 0) {
                
                    // we have spawnpoints left, let's check them
                    if (map.spawnPoints.length > 0) {
                
                        this.updateSpawnPoints(game.id, mapId); 
                    
                    }
                    
                    changes = {};
                    
                    hero = _.find(map.state.elements, function(i) { return i.assetId == 'hero.png'; });

                    _.each(map.state.elements, function(e) {

                        if (e.is(F.HYSTRIX) && hero && !hero.is(F.DEAD)) {

                            Core.Combat.hit(e, hero, e.skills[0]);    
                            changes[hero.id] = { 'life': hero.c.life };

                        }
                    
                    });
                    
                    if (_.size(changes) > 0) {
                    
                        this.broadcast(_.pluck(map.players, 'socket'), 'diff', changes);
                    
                    }                    
                    
                }
            
            }, this);
            
        }, 
        
        // create a creature
        creature: function(x, y, creatureFlag) {
        
            var blueprint = Utils.creatureBlueprint(creatureFlag), 
                creature = _.extend({}, blueprint[2]);
            
            creature.id = this.id();
            creature.flags = blueprint[1].slice();
            
            Core.prepareElement(creature);
            Core.Position.update(creature, x, y);
            
            return creature;                    
        
        }, 
        
        // check all spawnpoints if any of them is in range of a player and 
        // needs to spawn
        updateSpawnPoints: function(gameId, mapId) {
            
            // get all spawnpoints which are near players
            var map = this.map(gameId, mapId), 
                activeSpawnpoints = _.filter(map.spawnPoints, function(sp) {
            
                    return _.find(map.players, function(p) { 
                    
                        return Utils.distance(p.hero.x, p.hero.y, sp[0], sp[1]) <= 1500;
                    
                    }) != undefined;
                
                });
        
            // go through all activated spawnpoints: spawn and remove them
            // TODO: handle multi-/frequent spawner and champion/elite 
            // handling
            _.each(activeSpawnpoints, function(sp) {
            
                var i;
                
                for (i = 0; i < sp[3]; i++) {
                
                    this.addElement(gameId, mapId, this.creature(sp[0], sp[1], sp[2]));
                
                } 
                
                map.spawnPoints = _.without(map.spawnPoints, sp);       
            
            }, this);               
        
        }, 
        
        autoSavePlayers: function() {
        
            var ts = +new Date();
            
            _.each(this.players, function(e) {
            
                if (ts - (e.socket.tsLastSaved || 0) > this.msAutoSave) {
                
                    fs.writeFile('./../store/players/' + e.playername + '.json', JSON.stringify(e.player), function(err) {}); 
                    
                    e.socket.tsLastSaved = ts;   
                
                }
            
            }, this);
        
        }, 
        
        // get a player's item based on the itemId
        item: function(player, itemId) {
        
            return _.find(player.items, function(i) { return i[0] == itemId; });    
        
        },
        
        // change the location of an item by passing in a location flag
        // optionally a more detailed information can be provided to indicate 
        // e.g. an equipment slot, a grid position or global map coordinates
        changeItemLocation: function(item, location, detail) {
        
            item[4] = [location, detail];
        
        }, 
        
        // put an item from anywhere (must belong to the player) into 
        // the players hand 
        grab: function(socket, itemId) {
        
            var item = this.item(socket.player, itemId), 
                space;
            
            if (item) {
            
                // check if we need to remove the item from a space 
                // e.g.: inventory or stash
                space = _.find(socket.player.spaces, function(i) { return i[0] == item[4][0]; });
                
                if (space) {
                
                    this.removeItemFromSpace(socket.player, space, item);    
                
                }
                
                // we move the item to the hand
                this.changeItemLocation(item, F.HAND); 
            
            }
        
        },
        
        // try to put the item in hand in the inventory
        putToSpace: function(socket, spaceKey) {
        
            // get the item the player has currently in hand
            var item = Utils.itemByLocation(socket.player, F.HAND);
            
            // if we could find one we add it to the inventory
            if (item) {
            
                this.addItemToSpace(socket.player, spaceKey, item);
            
            }
        
        }, 
        
        // try to place the item in hand in the space
        place: function(socket, spaceKey, row, col) {
        
            // get the item the player has currently in hand
            var item = Utils.itemByLocation(socket.player, F.HAND);
            
            if (item) {
            
                this.addItemToGrid(socket.player.spaces[spaceKey].grid, item, row, col);
            
            }    
        
        }, 
        
        // we're asked to pickup an item, let's make some things sure before 
        // we do:
        // - the item is actually a drop
        // - player needs to be within pickup range
        // - if item is gold we add it directly to the balance
        pickup: function(socket, itemId) {
        
            // get the item 
            var item = this.item(socket.player, itemId);
            
            if (item && item[4][0] == F.DROP && Utils.distance(socket.player.hero.x, socket.player.hero.y, item[4][1][0], item[4][1][1]) <= Utils.attr(socket.player.hero, 'pickupradius')) {
                
                if (Utils.is(item, F.GOLD)) {
                
                    player.balance += item[2].amount;
                    
                    this.destroyItem(player, item);
                
                } else {
                
                    this.grab(socket, itemId);
                    this.putToSpace(socket, 'inventory');
                
                }           
            
            }
        
        }, 
        
        // equip an item
        // this can only be done from hand or from inventory
        equip: function(socket, itemId, slotHint) {
        
            // get the item
            var item = this.item(socket.player, itemId), 
                slot;

            if (item && [F.HAND, F.INVENTORY].indexOf(item[4][0]) != -1) {
            
                if (item[4][0] == F.INVENTORY) {
                
                    this.grab(socket, itemId);
                
                } 
                
                slot = Utils.slot(item, slotHint); 
                
                this.changeItemLocation(item, F.EQUIPMENT, slot); 
                
                socket.player.hero.equipment.push(item);  
            
            }    
        
        }, 
        
        // we're asked to unequip an item, let's make sure everything is 
        // correct
        // - the item is actually an equipment
        unequip: function(socket, itemId, putToInventory) {
        
            // get the item
            var item = this.item(socket.player, itemId);
            
            if (item && item[4][0] == F.EQUIPMENT) {
            
                socket.player.hero.equipment = _.without(socket.player.hero.equipment, function(i) { return i[0] == itemId; });
            
                this.grab(socket, itemId);
                
                if (putToInventory) {
                
                    this.putToInventory(socket);
                
                }
            
            }
        
        }, 
        
        // drop something on the floor
        drop: function(socket, itemId) {
        
            // get the item
            var item = this.item(socket.player, itemId);
            
            if (item && item[4][0] == F.HAND) {
            
                // we move the item to the floor
                // TODO: calculate some nice position
                this.changeItemLocation(item, F.HAND, [socket.player.hero.x - 50, socket.player.hero.y - 50]);    
            
            }
        
        }, 
        
        // destroy an item (i.e. remove it altogether)
        // this is basically only needed when merging stacks of items or 
        // in crafting
        destroyItem: function(player, item) {
        
            player.items = _.filter(player.items, function(i) { return i[0] !== item[0] });                    
        
        }, 
        
        // get a stack by checking all passed items for a passed location and 
        // compare to the item 
        getStack: function(player, location, item) {
        
            return _.find(Utils.itemsByLocation(player, location), function(i) {
            
                return Utils.is(i, item[1]);
            
            });
        
        }, 
        
        // we try to add an item to a space (indicated by spaceKey)
        // we load the space, get its grid and try to get an empty 
        // position in it
        // if we can find one we put the item into the grid and 
        // change the location of the item to the space and the 
        // calculated position
        addItemToSpace: function(player, spaceKey, item) {
        
                // get the space from the players spaces
            var space = player.spaces[spaceKey], 
                // get the space grid, if not yet setup -> create one
                grid = space[3], 
                pos, stack;
            
            // if the item can be stacked we first try to find an existing 
            // stack    
            if (item[2].stack) {
            
                stack = this.getStack(player, space[0], item);
                
                // we found a stack, let's just increase the amount
                // afterwards we remove the item
                if (stack) {
                
                    stack[2].stack += item[2].stack;
                                        
                    this.destroyItem(player, item);
                    
                    return;
                
                } 
            
            }
            
            pos = this.getEmptyPosition(grid, item);                  
                 
            if (pos) {
            
                // add the item to the grid on the calculated position
                this.addItemToGrid(grid, item, pos[0], pos[1]);
                
                // change the location of the item to the space and 
                // the calculated position
                this.changeItemLocation(item, space[0], pos);
            
            } 
        
        }, 
        
        // remove item from space
        removeItemFromSpace: function(player, space, item) {
        
            var grid = space[3] || this.createGrid(player, space);
            
            this.removeItemFromGrid(grid, item, item[4][1][0], item[4][1][1]);                
        
        }, 

        // mark a grid area with a given value
        // normally used to mark grid cells as empty or occupied
        markGridArea: function(grid, row, col, w, h, v) {
        
            var i, j;
            
            for (i = row; i < row + w; i++) {
            
                for (j = col; j < col + h; j++) {
                
                    grid[i][j] = v;    
                
                }
            
            }
        
        }, 

        // remove item from grid
        removeItemFromGrid: function(grid, item, row, col) {
        
            this.markGridArea(grid, row, col, item[2].spaceWidth || 1, item[2].spaceHeight || 1, 0);
        
        }, 

        // we want to add a item to a grid at a distinct location
        // we assume that a check was performed beforehand to make 
        // sure the grid is empty at the given position
        addItemToGrid: function(grid, item, row, col) {

            this.markGridArea(grid, row, col, item[2].spaceWidth || 1, item[2].spaceHeight || 1, 1);
        
        }, 
        
        // get the first index [row, col] of a space large enough to fit 
        // in the given item in the given grid
        getEmptyPosition: function(grid, item) {
        
            var w = item[2].spaceWidth || 1, 
                h = item[2].spaceHeight || 1, 
                i, j, k, l, empty;
            
            item[2].info = 'getEmptyPosition ' + w + '/' + h + ' - ' + grid.length + '/' + grid[0].length;
            item[2].gridInfo = [];
            
            // loop through the grid and check for each field if there are 
            // enough empty fields nearby to hold the item
            for (i = 0; i < grid.length; i++) {
            
                for (j = 0; j < grid[i].length; j++) {
                    
                    // make sure we are not in the last column or last row 
                    // and the width or height of the item exceeds the 
                    // grid dimensions
                    if (i + h < grid.length && j + w < grid[i].length) {
                
                        empty = true;
                
                        for (k = 0; k < w; k++) {
                        
                            for (l = 0; l < h; l++) {
                            
                                if (grid[i + k][j + l] != 0) {
                                
                                    empty = false;
                                
                                }
                            
                            }
                        
                        } 

                        // we found enough space so let's return the index 
                        // of the upper left field
                        if (empty) {
                    
                            return [i, j];
                        
                        } 
                    
                    } 
                
                }
            
            } 
            
            return null;   
        
        }, 
        
        // we encountered a space that did not have a grid. Let's create one 
        // based on the spaces dimensions ([1] = rows, [2] = cols)
        // afterwards we grab all players items located in the space and 
        // place them accordingly
        // items have their location stored in [4] while the position is 
        // stored in the details field [1][row,col]
        createGrid: function(player, space) {
        
            // we get an empty grid -> this is a 2-dimensional array 
            // initiated with a 0 in every field
            space[3] = Utils.createGrid(space[1], space[2]);
        
            // loop through all player's items assigned to the space and 
            // mark its space in the grid
            _.each(Utils.itemsByLocation(player, space[0]), function(i) {

                this.addItemToGrid(space[3], i, i[4][1][0], i[4][1][1]);  
            
            }, this);
        
        }
             
    }
    
    if (typeof module !== 'undefined') {
    
        module.exports = Server;
    
    } else {
    
        window.Server = Server;
    
    }

}).call(this);
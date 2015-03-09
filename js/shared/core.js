"use strict";

(function() {

    if (typeof _ === 'undefined') {
    
        if (typeof require !== 'undefined') {
    
            var _ = require('../underscore.min.js');
        
        } else if (this._) {
        
            var _ = this._;
        
        }
    
    } 
    
    var Core = {
    
        Flags: {
            WEAPON: 0, 
            ARMOR: 1, 
            JEWELRY: 2, 
            MATERIAL: 3, 
            ORNAMENT: 4, 
            UTILITY: 5, 
            QUEST: 6,
            OTHER: 7,
            ONEHAND: 8,
            TWOHAND: 9, 
            BELT: 10,
            HEADPIECE: 11,
            PANTS: 12,
            GLOVES: 13,
            SHOULDERS: 14,
            BRACERS: 15,
            OFFHAND: 16, 
            RING: 17,
            AMULET: 18, 
            TOKEN: 19, 
            BOOTS: 20,
            GEM: 21, 
            POTION: 22,
            RUNE: 23,
            HEALTHGLOBE: 24,
            CHESTARMOR: 25,
            SWORD: 26,
            STAFF: 27,
            BOW: 28,
            RUBY: 29,
            EMERALD: 30,
            TOPAZ: 31,
            AMETHYST: 32,
            SAPPHIRE: 33, 
            SMALLSWORD: 34,
            CHIPPED: 35,
            FLAWED: 36,
            NORMAL: 37,
            MAGIC: 38,
            RARE: 39,
            SET: 40,
            LEGENDARY: 41,
            ANCIENT: 42,
            ETHERAL: 43,
            GOLD: 44,
            HEALTHPOTION: 45,
            AUTOPICKUP: 46,
            FLAWLESS: 47,
            PERFECT: 48, 
            SOCKETED: 49, 
            INFERIOR: 50,
            GOOD: 51, 
            EXCEPTIONAL: 52, 
            STANDARD: 53, 
            ITEM: 54                
        }, 
        
        Settings: null, 
    
        dt: 0, 
    
        init: function() {
        
            // pre-process the droptables
            _.each(this.Settings.droptables, function(dt) {
            
                _.each(dt.items, function(dti) {
    
                    dti[0] = this.Flags[dti[0].toUpperCase()];
                
                }, this);
            
            }, this);
            
            // pre-process the blueprints
            _.each(this.Settings.blueprints, function(bp) {
            
                for (var i = 0; i < bp[4].length; i++) {
                
                    bp[4][i] = this.Flags[bp[4][i].toUpperCase()];
                
                }
            
            }, this);
            
            // pre-process the affixes
            _.each(this.Settings.affixes.prefixes, function(a) {
            
                for (var i = 0; i < a[3].length; i++) {
                
                    a[3][i] = this.Flags[a[3][i].toUpperCase()];
                
                }
            
            }, this);
            
            // pre-process the affixes
            _.each(this.Settings.affixes.suffixes, function(a) {
            
                for (var i = 0; i < a[3].length; i++) {
                
                    a[3][i] = this.Flags[a[3][i].toUpperCase()];
                
                }
            
            }, this);
            
            _.each(this.Settings.itemRanks, function(i) {
            
                i[0] = this.Flags[i[0].toUpperCase()];
            
            }, this);
            
            _.each(this.Settings.itemQualities, function(i) {
            
                i[0] = this.Flags[i[0].toUpperCase()];
            
            }, this);
        
        }, 
    
        update: function(e) {
        
            if (e.target) {
            
                Core.Translate.byTarget(e);
            
            } 
        
        }, 
        
        prepareElement: function(e) {
        
            e.width = Assets.meta[e.assetId].spriteDimensions[0];
            e.height = Assets.meta[e.assetId].spriteDimensions[1];
            e.width_h = Math.floor(e.width / 2);
            e.height_h = Math.floor(e.height / 2);
            e.box = [0, 0, 0, 0];
            e.hitBox = [0, 0, 0, 0];
            e.speed_c = e.speed;
            
            Core.Translate.update(e);
            
            return e;
        
        },
        
        // check if the given position is on the map (nothing should get off
        // the map)
        validatePosition: function(x, y) {
        
            return x >= 0 && y >= 0 && x <= Game.state.map.width && y <= Game.state.map.height;
        
        }, 
        
        // grab a tile by a set of coordinates
        tile: function(x, y) {
        
            var t;
        
            // make sure the position is valid
            if (Core.validatePosition(x, y)) {
            
                t = Game.state.map.grid.tiles[Math.floor(y / 32) * Game.state.map.grid.cols + Math.floor(x / 64)];   
            
            } else {
            
                t = { walkable: false };
            
            }
            
            return t;      
        
        }, 
    
    //// M O V E M E N T    S E C T I O N //////////////////////////////////////////
        
        Translate: {
        
            // check if the position is valid and the given element 
            // can move to it
            canMoveTo: function(x, y, e) {
            
                return Core.tile(x, y).walkable;
            
            }, 
        
            // change an elements position by offsets in both directions  
            by: function(e, dx, dy) {
            
                var d = 0, 
                    nx = e.x + dx, 
                    ny = e.y + dy;
            
                // can move to check goes here!!
                if (Core.Translate.canMoveTo(nx, ny, e)) {
                
                    d = Core.Utils.distance(e.x, e.y, nx, ny);
                
                    e.x = nx;
                    e.y = ny;
                    
                    Core.Translate.update(e);       
                
                }
            
                return d; 
            
            },
            
            // change an elements position by using its target
            byTarget: function(e) {
            
                // speed = 1 means 1px/ms
                var speed = e.speed_c * Core.dt / 10, 
                    distanceTravelled = Core.Translate.by(e, e.target.dx * speed, e.target.dy * speed);
                
                if (distanceTravelled) {
                
                    // we don't travel infinitely
                    if (!e.target.infinitely) {
                    
                        // let's subtract the distance travelled this frame from 
                        // the total distance left 
                        e.target.distance -= distanceTravelled;
                        
                        // we have reached our target
                        if (e.target.distance <= 0) {
                        
                            Core.Translate.stop(e);
                        
                        }
                    
                    }
                
                } else {
                
                    Core.Translate.stop(e);
                
                }            
            
            }, 
            
            // create a target object based on the destination
            createTarget: function(x, y, tx, ty, infinitely) {
            
                var d = Core.Utils.distance(x, y, tx, ty);
            
                return {
                    x: tx, 
                    y: ty, 
                    dx: (tx - x) / d, 
                    dy: (ty - y) / d, 
                    distance: d, 
                    tsStart: +new Date(), 
                    infinitely: infinitely || false, 
                    next: null            
                }
            
            },  
            
            // tell the element to move to a destination 
            to: function(e, x, y, infinitely) {
            
                // set a target
                e.target = Core.Translate.createTarget(e.x, e.y, x, y, infinitely);
    
                // set the elements rotation
                e.rotation = Core.Utils.direction(e.x, e.y, x, y);
            
            },
            
            // stop the element from moving
            stop: function(e, full) {
            
                if (!full && e.target && e.target.next) {
                
                    e.target = e.target.next;
                
                } else {
            
                    e.target = null;
                
                }
            
            }, 
            
            // update all attributes of the element relevant to movement
            update: function(e) {
            
                e.box[0] = e.x - e.width_h;
                e.box[1] = e.y - e.height;
                e.box[2] = e.x + e.width_h;
                e.box[3] = e.y;
                
                e.hitBox[0] = e.box[0] + Assets.meta[e.assetId].hitboxOffset[0];
                e.hitBox[1] = e.box[1] + Assets.meta[e.assetId].hitboxOffset[1];
                e.hitBox[2] = e.box[2] - Assets.meta[e.assetId].hitboxOffset[2];
                e.hitBox[3] = e.box[3] - Assets.meta[e.assetId].hitboxOffset[3];
            
            }
        
        }, 
        
    //// U T I L I T Y    S E C T I O N ////////////////////////////////////////////    
        
        Utils: {
        
            // check if an item matches all conditions
            // i.e: the item contains all given flags
            is: function(e, condition1) {
        
                return arguments.length - 1 == _.intersection(arguments[0][1], [].slice.call(arguments, 1)).length;
            
            }, 
            
            // get a blueprint for a set of flags
            blueprint: function(flags) {
            
                var bp;

                _.each(Core.Settings.blueprints, function(blueprint) {

                    if (_.intersection(flags, blueprint[4]).length == blueprint[4].length) {
                    
                        bp = blueprint;
                        return;    
                    
                    }
                
                });    
                
                return bp;
            
            },

            // returns the name of an item/creature based on the flags
            // flags are alway the first element, the name is the first 
            // element in the blueprint
            name: function(e) {
            
                return e[2].name || this.blueprint(e[1])[0];

            }, 
            
            // displayName
            displayName: function(e) {
            
                var name = this.name(e);
            
                if (this.is(e, Core.Flags.SOCKETED)) {
                
                    name = 'Socketed ' + name + ' [' + e[2].sockets.length + ']';
                
                } 
                
                if (this.is(e, Core.Flags.INFERIOR)) {
                
                    name = 'Inferior ' + name;
                
                } else if (this.is(e, Core.Flags.GOOD)) {
                
                    name = 'Good ' + name;
                
                } else if (this.is(e, Core.Flags.EXCEPTIONAL)) {
                
                    name = 'Exceptional ' + name;
                
                } else if (this.is(e, Core.Flags.ETHERAL)) {
                
                    name = 'Etheral ' + name;
                
                }
                
                if (this.is(e, Core.Flags.WEAPON)) {
                
                    name = name + ' { ' + this.attr(e, 'minDmg').toFixed(1) + ' - ' + this.attr(e, 'maxDmg').toFixed(1) + ', ' + this.dps(e).toFixed(1) + 'dps } ';
                
                } else if (this.is(e, Core.Flags.ARMOR)) {
                
                    name = name + ' { ' + e[2].armor.toFixed(0) + ' } ';
                
                }
                
                return name;     
            
            }, 
            
            attr: function(e, a) {
                
                var v;
            
                if (this.is(e, Core.Flags.ITEM)) {
                
                    if (e[2][a]) {
                    
                        v = e[2][a];
                    
                    }
                    
                    if (e[2].affixes && e[2].affixes[a]) {
                    
                        if (v) {
                        
                            if (a.indexOf('_p') != -1) {
                        
                                v *= e[2].affixes[a];
                            
                            } else {
                            
                                v += e[2].affixes[a];
                            
                            }
                        
                        } else {
                        
                            v = e[2].affixes[a];
                        
                        }
                    
                    }
                
                }
                
                //console.log(a, v, e);
                
                return v;
            
            },
            
            attrP: function(e, a, base) {
            
                return (this.attr(e, a) || 0) / 100 + (base || 1);
            
            },  
            
            attackSpeed: function(e) {
            
                if (this.is(e, Core.Flags.WEAPON)) {
                
                    return this.attr(e, 'as') * this.attrP(e, 'ias_p');
                
                }
            
            }, 
            
            damage: function(e) {
            
                if (this.is(e, Core.Flags.WEAPON)) {
                    
                    return ((this.attr(e, 'minDmg') + this.attr(e, 'maxDmg')) / 2) * this.attrP(e, 'dmg_p');
                  
                }
            
            }, 
            
            dps: function(e) {
            
                var dmg;
            
                if (this.is(e, Core.Flags.WEAPON)) {
                                                                                                    
                    dmg = this.damage(e);
                    
                    return (dmg + (dmg * this.attrP(e, 'critDmg_p') * this.attrP(e, 'critChance_p', 0))) * this.attackSpeed(e);  
                
                } 
                
                return dps;  
            
            }, 
        
            // calculate the distance between two positions in pixels
            distance: function(x, y, x2, y2) {
            
                return Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));  
            
            }, 
            
            // calculate the angle between the given vector and the x-axis
            direction: function(x, y, x2, y2) {
            
                var theta = Math.atan2((y2 - y) * -1, x2 - x);
                
                if (theta < 0) {
                
                    theta += 2 * Math.PI;
                
                }
                
                return theta;
            
            }, 
            
            // random value between min and max
            random: function(min, max) {

                return Math.random() * (max - min) + min;
            
            }, 
            
            // return a random int value
            randomInt: function(min, max) {

                if (max == undefined) {

                    return Math.round(this.random(min[0], min[1]));
                
                }

                return Math.round(this.random(min, max));
            
            }, 
            
            // random item from a list of items
            randomA: function(set) {
            
                return set[this.randomInt(0, set.length - 1)];    
            
            }, 
            
            // random item from a set with different probabilities
            // set is a list of arrays where [index] 
            // holds the probability (0 = 0%, 1 = 100%)
            // e.g.: [[123, 0.2, 'abc'], [234, 0.8, 'cdx']]
            // in the example the method would return element 1 in 20% and 
            // element 2 in 80% of the cases
            randomP: function(set, probabilityIndex) {
            
                // get a random number and initialize v as 0
                var r = Math.random(),
                    v = 0, i; 
                
                // we loop through the set and add up the probability each 
                // iteration. if the probability is larger than the random 
                // number we've found our element  
                // if all propabilities add up to 1 this should return 
                // individual elements correctly
                for (i = 0; i < set.length; i++) {
                
                    v += set[i][probabilityIndex];
                
                    if (r <= v) {

                        return set[i];
                    
                    }    
                
                }
            
                return null;       
            
            }, 
            
            // random item from a set with different probabilities
            // in this case the probabilities are relative
            // i.e. grab all higher than the random number and 
            // randomy choose one of the resulting
            randomP2: function(set, probabilityIndex) {
            
                // get a random number
                var r = Math.random(),
                // filter the set for all items with a higher probability 
                // than the choosen random value 
                    set = _.filter(set, function(i) { return i[probabilityIndex] >= r; });
                
                if (set.length > 0) {
                
                    // return a random item from the set
                    return this.randomA(set);
                
                }
                
                return null;            
            
            }, 
            
            // random item from a list filtered first by min/max level check
            randomL: function(set, level, probabilityIndex, minLevelIndex, maxLevelIndex) {

                return this.randomP2(_.filter(set, function(i) {
                
                    return level >= i[minLevelIndex] && level <= i[maxLevelIndex];
                
                }), probabilityIndex);
            
            }, 
            
            // random item from a list filtered by min/max level check and 
            // flags
            randomL2: function(set, level, flags, probabilityIndex, minLevelIndex, maxLevelIndex, flagIndex) {
            
                return this.randomL(_.filter(set, function(i) {
                
                    return _.intersection(i[flagIndex], flags).length > 0;
                
                }), level, probabilityIndex, minLevelIndex, maxLevelIndex);
            
            }          
        
        }
    
    }
    
    if (typeof module !== 'undefined') {
    
        Core.Settings = require('./../store/settings.json');
        Core.init();
    
        module.exports = Core;
    
    } else {
        
        window.Core = Core;
    
    }

}).call(this);
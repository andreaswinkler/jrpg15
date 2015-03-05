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
            AUTOPICKUP: 46                  
        }, 
    
        dt: 0, 
    
        check: function(e, condition1) {
        
            return arguments.length - 1 == _.intersection(arguments[0][0], [].slice.call(arguments, 1)).length;
        
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
            
                return Math.round(this.random(min, max));
            
            }, 
            
            // random item from a set with different probabilities
            // set is a list of arrays where [0] holds the element
            // and [1] holds the probability (0 = 0%, 1 = 100%)
            // e.g.: [[{object 1}, 0.2], [{object 2}, 0.8]]
            // in the example the method would return object 1 in 20% and 
            // object 2 in 80% of the cases
            randomA: function(set, returnComplete, key) {
            
                // get a random number and initialize v as 0
                var r = Math.random(),
                    returnComplete = returnComplete || false, 
                    key = key || 1,  
                    v = 0, i;

                // we loop through the set and add up the probability each 
                // iteration. if the probability is larger than the random 
                // number we've found our element  
                // if all propabilities add up to 1 this should return 
                // individual elements correctly
                for (i = 0; i < set.length; i++) {
                
                    v += set[i][key];
                
                    if (r <= v) {
                    
                        if (returnComplete) {
                        
                            return set[i];
                        
                        } else {
                        
                            return set[i][0];
                        
                        }
                    
                    }    
                
                }
            
                return null;
            
            }
        
        }
    
    }
    
    if (typeof module !== 'undefined') {
    
        module.exports = Core;
    
    } else {
    
        window.Core = Core;
    
    }

}).call(this);
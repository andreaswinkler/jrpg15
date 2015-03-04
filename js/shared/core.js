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
    
        dt: 0, 
    
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
            
            // random int value between min and max
            randomInt: function(min, max) {
            
                return Math.floor(Math.random() * (max - min) + min);
            
            }, 
        
        }
    
    }
    
    if (typeof module !== 'undefined') {
    
        module.exports = Core;
    
    } else {
    
        window.Core = Core;
    
    }

}).call(this);
"use strict";

(function(exports){

    if (typeof _ === 'undefined') {
    
        if (typeof require !== 'undefined') {
    
            var _ = require('../server/node_modules/underscore/underscore-min.js');
        
        } else {
        
            var _ = window._;
        
        }
    
    } 

    // id stuff / should happen in database
    exports._id = 0;
    exports.id = function() {
    
        return ++this.id;
    
    };

    // determine slot
    exports.slot = function(item, slotHint) {
    
        return slotHint;
    
    };

    // space 
    exports.createSpace = function(flag, dimensions) {
    
        return {
            f: flag, 
            grid: this.createTwoDimensionalArray(dimensions[0], dimensions[1])
        };  
    
    };
    
    // returns an empty grid (i.e. 2-dimensional array) of given dimensions
    exports.createTwoDimensionalArray = function(rows, cols) {
        
        var a = [], i, j;
        
        for (i = 0; i < rows; i++) {
        
            a.push([]);
            
            for (j = 0; j < cols; j++) {
            
                a[i].push();
            
            }
        
        }
        
        return a;
    
    };
    
    // deep update a property
    // attribute is passed in as path (e.g.: a.b.c), path is created if 
    // it can't be traversed
    exports.deepUpdateProperty = function(obj, path, value) {
    
        var path = path.split('.'),  
            i;
        
        for (i = 0; i < path.length - 1; i++) {
        
            obj = obj[path[i]] || (obj[path[i]] = {});
        
        }
        
        obj[path[path.length - 1]] = value;
    
    };
    
    // distance
    exports.distance = function(x, y, x2, y2) {
    
        return Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));      
    
    };
    
    // calculate the angle between the given vector and the x-axis
    exports.direction = function(x, y, x2, y2) {
    
        var theta = Math.atan2((y2 - y) * -1, x2 - x);
        
        if (theta < 0) {
        
            theta += 2 * Math.PI;
        
        }
        
        return theta;
    
    };
    
    /* INRANGEOFANY
    *  checks if an entity is in range of a set of other entities
    */
    exports.inRangeOfAny = function(entity, entities, range) {
    
        return this.getFirstInRange(entity, entities, range) != null;
    
    };
    
    /* GETFIRSTINRANGE
    *  returns the first entity in range 
    */    
    exports.getFirstInRange = function(entity, entities, range) {
    
        return _.find(entities, function(e) { return this.inRange(entity, e, range); }, this) || null;
    
    };
    
    /* GETNEAREST
    *  returns the nearest entity
    *  can optionally be limited to a specific range    
    */
    exports.getNearest = function(entity, entities) {
    
        return _.first(_.sortBy(entities, function(e) { return this.distance(e.x, e.y, entity.x, entity.y); }, this));
    
    };    
    
    /* INRANGE
    *  check if an entity is in range of another entity
    */    
    exports.inRange = function(pos1, pos2, range) {
    
        return this.distance(pos1.x, pos1.y, pos2.x, pos2.y) <= range; 
    
    };
    
    // create a target
    exports.createTarget = function(x, y, tx, ty, infinitely) {
        
        var d;
        
        if (x == tx && y == ty) {
        
            return null;
        
        } else {
            
            d = this.distance(x, y, tx, ty);
       
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
        
        }
            
    };
    
    // move to
    exports.moveByTarget = function(entity, target, ticks, grid) {
    
        // speed 1 = 1px/ms
        var speed = entity._c.speed * ticks, 
            x = entity.x, 
            y = entity.y, 
            distance;
        
        entity.x += target.dx * speed;
        entity.y += target.dy * speed;
        
        distance = this.distance(x, y, entity.x, entity.y);
        
        // we actually moved, great
        if (distance) {
        
            // we don't travel infinitely
            if (!target.infinitely) {
            
                // let's subtract the distance travelled this frame from 
                // the total distance left 
                target.distance -= distance;  
                
                if (target.distance <= 0) {
                
                    return false;
                
                }      
            
            }
            
            return true; 
        
        }
        
        return false;     
    
    }; 

// RNG SECTION /////////////////////////////////////////////////////////////////
    
    // RANDOMELEMENT: randomly return an element from a list
    exports.randomElement = function(list) {
    
        return list[this.randomInt(0, list.length - 1)];
    
    }; 
    
    // RANDOM: return a random decimal number between min and max
    exports.random = function(min, max) {
    
        return Math.random() * (max - min) + min;    
    
    };
    
    // RANDOMINT: return a random integer between min and max
    exports.randomInt = function(min, max) {
    
        return Math.round(this.random(min, max));       
    
    };    
    

})(typeof exports === 'undefined' ? this['Core'] = {} : exports);
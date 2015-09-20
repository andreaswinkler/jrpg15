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
    exports._id = 10;
    exports.id = function() {
    
        return ++this._id;
    
    };
    
    // constant; the internal size of a tile in pixels
    exports.TS = 50;

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
    
    // hitTest
    exports.hitTest = function(entity, list) {
        
        return _.find(list, function(e) { return e._id != entity._id && this.hitTestRects(e._hitBox, entity._hitBox); }, this);
    
    };
    
    // hitTestPosition
    exports.hitTestPosition = function(list, x, y) {
        
        return _.find(list, function(e) { return x >= e._hitBox[0] && x <= e._hitBox[2] && y >= e._hitBox[1] && y <= e._hitBox[3]; });
    
    };
    
    // hitTestRects
    exports.hitTestRects = function(r1, r2) {
        
        return !(r1[0] > r2[2] || r1[2] < r2[0] || r1[1] > r2[3] || r1[3] < r2[1]);  
            
    };
    
    // calculate the angle between the given vector and the x-axis
    exports.direction = function(x, y, x2, y2) {
    
        var theta = Math.atan2((y2 - y) * -1, x2 - x);
        
        if (theta < 0) {
        
            theta += 2 * Math.PI;
        
        }
        
        return theta;
    
    };
    
    /* REMOVE
    *  remove an element from a list
    */    
    exports.remove = function(element, list) {
        
        var i;
        
        for (i = 0; i < list.length; i++) {
        
            if (list[i] === element) {
            
                list.splice(i, 1);
                i--;
            
            } 
        
        }
    
    };
    
    /* REMOVEALL
    *  remove a set of elements from a list
    */
    exports.removeAll = function(set, list) {
    
        _.each(set, function(e) {
        
            this.remove(e, list);
        
        }, this);
    
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
    
    // einheitsvektor
    exports.unitVector = function(pos1, pos2) {
    
        var d = this.distance(pos1.x, pos1.y, pos2.x, pos2.y);
        
        return [
            pos2.x - pos1.x / d, 
            pos2.y - pos1.y / d
        ];
    
    };
    
    // create a target
    exports.createTarget = function(x, y, tx, ty, range, infinitely) {
        
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
                range: range || d, 
                tsStart: +new Date(), 
                infinitely: infinitely || false, 
                next: null            
            }
        
        }
            
    };
    
    // move to
    exports.moveByTarget = function(entity, target, seconds, map) {
    
        // speed 1 = 1px/s
        var speed = entity._c.speed * seconds, 
            x = entity.x, 
            y = entity.y, 
            nx = x + target.dx * speed, 
            ny = y + target.dy * speed, 
            destination = { _id: entity._id, _hitBox: [nx - entity._halfWidth, ny - entity.height, nx + entity._halfWidth, ny] },   
            distance;
        
        // let's check if we can move to our desired position
        // we need to check if the ground is walkable (in case we are not 
        // flying) and if we don't run into something (except we are 
        // allowed to)
        if (
            // check ground for walkable
            (entity.isFlying || this.tile(map, nx, ny).walkable) &&
            // check all creatures/lootables so we don't run into something
            (entity.isFlying || (!this.hitTest(destination, map.creatures) && !this.hitTest(destination, map.heroes) && !this.hitTest(destination, map.lootables))) &&
            // check map boundaries 
            (destination._hitBox[0] >= 0 && destination._hitBox[1] >= 0 && destination._hitBox[2] <= map._width && destination._hitBox[3] <= map._height)
        ) {
        
            entity.x = nx;
            entity.y = ny;
            
            distance = this.distance(x, y, nx, ny);
            
            // we actually moved, great
            if (distance) {
            
                // we don't travel infinitely
                if (!target.infinitely) {
                
                    // let's subtract the distance travelled this frame from 
                    // the total range left 
                    target.range -= distance;
                     
                    
                    if (target.range <= 0) {
                    
                        return false;
                    
                    }      
                
                }
                
                this.setPosition(entity, entity.x, entity.y, map);
                
                return true; 
            
            }    
        
        }
        
        return false;    
    
    }; 
    
    // get a tile by it's x and y coordinates
    exports.tile = function(map, x, y) {

        // sanity check if the given position is inside our map
        if (x >= 0 && x <= map._width && y >= 0 && y <= map._height) {

            return map.grid[(~~(y / this.TS)) + '_' + (~~(x / this.TS))] || {};
        
        }
        
        return {}; 
    
    };
    
    /* CANUSESKILL
    *  check if a skill is ready and can be afforder
    */
    exports.canUseSkill = function(entity, skill) {
    
        if (skill._cooldown) {
            console.log('cant use skill', skill.name, 'oncooldown');
        }
        
        if (skill.manaCost > entity._c.mana) {
            console.log('cant use skill', skill.name, 'nomana');    
        }
    
        return !skill._cooldown && skill.manaCost <= entity._c.mana;
    
    };
    
    /* RESOLVEINPUT
    *  this is only for non-ui (map) inputs
    */    
    exports.resolveInputs = function(entity, map, handlers) {
    
        _.each(entity._inputs, function(input) {
        
            var target, skill, move = false;
        
            switch (input.key) {
            
                // left-click can mean one of the following:
                // - walk to
                // - attack
                // - interact 
                // if shift is true we ignore the walk-to option
                case 'mouseLeft':
                    
                    // first we hit-test all creatures
                    // and interactables 
                    target = this.hitTestPosition(map.creatures, input.x, input.y);
                    
                    skill = entity.skills[0]; 

                    // if we hold the shift key we attack if possible but never
                    // move
                    if (input.shift) {
                    
                        if (target && skill && this.canUseSkill(entity, skill)) {
                        
                            handlers.skill.call(handlers.context, entity, skill, target, map, map.creatures);    
                        
                        }
                    
                    } else {
                        
                        // if we have a target and a mouseLeft skill 
                        // and this skill is not on cooldown
                        // and we can afford to use the skill
                        // and we are in range of our target to use the skill
                        if (target && skill && this.canUseSkill(entity, skill) && this.inRange(entity, target, skill.range)) {
                        
                            handlers.skill.call(handlers.context, entity, skill, target, map, map.creatures);    
                        
                        } else {
                        
                            // if we couldn't find anything we walk to the position
                            // if possible 
                            if (this.tile(map, input.x, input.y).walkable) {
                            
                                handlers.moveTo.call(handlers.context, entity, input.x, input.y);     
                            
                            }
                        
                        }
                    
                    }
                
                    break;
            
            }
        
        }, this); 
        
        // all inputs have been processed
        entity._inputs = [];   
    
    };
    
    // deep-copy of an object
    exports.clone = function(obj) {

        return JSON.parse(JSON.stringify(obj));
    
    };
    
    // set position
    // x/y/z marks the bottom center of the entity
    exports.setPosition = function(entity, x, y, map) {
    
        var tile = this.tile(map, x, y);
    
        entity.x = x;
        entity.y = y;
        entity.z = tile ? tile.z : 0;
        
        entity._hitBox = [
            ~~(entity.x - entity._halfWidth), 
            ~~(entity.y - entity.height), 
            ~~(entity.x + entity._halfWidth), 
            ~~(entity.y)];
    
    }

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
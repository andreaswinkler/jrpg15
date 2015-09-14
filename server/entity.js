"use strict";

module.exports = function(Core, F) {

    return {
    
        createCharacter: function(settings) {

            return {
            
                _id: settings._id, 
                xp: settings.xp, 
                assetId: settings.assetId, 
                pickupradius: settings.pickupradius, 
                vit: settings.vit, 
                int: settings.int, 
                str: settings.str, 
                dex: settings.dex, 
                speed: settings.speed,
                life: settings.vit * 10,
                lifePerSecond: 5, 
                x: 0, 
                y: 0, 
                z: 0, 
                rot: 0,
                rank: F.NORMAL,      
            
                equipment: {
                    weapon: null, 
                    offhand: null
                }, 
            
                equip: function(item, slotHint) {
                
                    var slot = Core.getSlot(item, slotHint);
                    
                    this.equipment[slot] = item;
                
                }, 
                
                _c: {
                    
                    life: settings.vit * 10, 
                    speed: settings.speed    
                        
                } 
              
            };   
        
        },
        
        /* CREATE
        *  create a chest or critter or something
        */         
        create: function(type, rank, x, y, map) {
        
            var lootable = {
            
                _id: Core.id(), 
                type: type, 
                rank: rank, 
                x: x, 
                y: y, 
                z: 0, 
                rot: 0
                        
            };
            
            // bind to map
            lootable._map = map;
            
            // send 'create' update
            _.each(['type', 'rank', 'x', 'y', 'z', 'rot'], function(e) {
                
                this.change(entity, e, entity[e]);    
                
            }, this);
            
            return lootable;       
        
        }, 
        
        /* MOVETO
        *  tell the entity to move towards a target
        */        
        moveTo: function(entity, x, y) {
        
            this.change(entity, 'target', Core.createTarget(entity.x, entity.y, x, y));
        
        },
        
        /* MOVE
        *  this is called if the entity has a target
        *  move the entity by the target settings        
        */        
        move: function(entity, ticks, grid) {        
        
            // try to move towards the target
            // if this is not possible for some reason (e.g. obstacle) 
            // the method returns false and we stop
            if (!Core.moveByTarget(entity, entity.target, ticks, grid)) {
            
                this.stop(entity);
            
            } 
        
        }, 
        
        /* UPDATEPOSITION
        *  makes sure the current entities position is sent to the client 
        *  as an update        
        */
        updatePosition: function(entity) {
        
            this.change(entity, 'x', entity.x);
            this.change(entity, 'y', entity.y);
            this.change(entity, 'z', entity.z);
            this.change(entity, 'rot', entity.rot);
        
        },
        
        /* STOP
        *  stop the entity by setting the target to null
        */        
        stop: function(entity) {
        
            this.change(entity, 'target', null);
            this.updatePosition(entity);   
        
        },  
        
        /* ADDLIFE
        *  Change the current life of an entity by a specific amount
        *  The method makes sure the upper (total life) and lower (0) 
        *  boundaries are respected                
        */        
        changeLife: function(entity, life) {
        
            this.change(entity, '_c.life', Math.max(0, Math.min(entity._c.life + life, entity.life)));
        
        }, 
        
        /* CHANGE
        *  register a change on an entity to the corresponding map object
        */        
        change: function(entity, key, value) {
        
            Core.deepUpdateProperty(entity, key, value);
        
            if (!entity._map.updates) {
            
                entity._map.updates = {};
            
            }
        
            if (!entity._map.updates[entity._id]) {
            
                entity._map.updates[entity._id] = {};
            
            }
        
            entity._map.updates[entity._id][key] = value;
        
        }
    
    }

};               
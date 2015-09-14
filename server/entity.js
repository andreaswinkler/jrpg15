"use strict";

module.exports = function(Core) {

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
            
                equipment: {
                    weapon: null, 
                    offhand: null
                }, 
            
                equip: function(item, slotHint) {
                
                    var slot = Core.getSlot(item, slotHint);
                    
                    this.equipment[slot] = item;
                
                }, 
                
                _c: {
                    
                    life: settings.vit * 10    
                        
                } 
              
            };   
        
        }, 
        
        move: function(entity) {
        
            entity.x += 5;
            
            this.change(entity, 'x', entity.x);
        
        }, 
        
        addLife: function(entity, life) {
        
            entity._c.life = Math.min(entity._c.life + life, entity.life);
            
            this.change(entity, 'life', entity._c.life);
        
        }, 
        
        /* CHANGE
        *  register a change on an entity to the corresponding map object
        */        
        change: function(entity, key, value) {
        
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
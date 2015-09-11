"use strict";

module.exports = function(Core) {

    return {
    
        create: function(settings) {
        
            return {
            
                id: settings.id, 
                xp: settings.xp, 
                assetId: settings.assetId, 
                pickupradius: settings.pickupradius, 
                vit: settings.vit, 
                int: settings.int, 
                str: settings.str, 
                dex: settings.dex, 
                speed: settings.speed, 
            
                equipment: {
                    weapon: null, 
                    offhand: null
                }, 
            
                equip: function(item, slotHint) {
                
                    var slot = Core.getSlot(item, slotHint);
                    
                    this.equipment[slot] = item;
                
                } 
              
            };   
        
        }
    
    }

};               
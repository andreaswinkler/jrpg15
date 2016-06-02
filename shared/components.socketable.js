"use strict";

module.exports = function SocketableComponentFactory() {

    return SocketableComponent;

    function SocketableComponent(entity, blueprint) {

        this.modifiers = function(item) {
        
            // first we check if we have modifiers specific for the items slot
            // e.g. head
            if (blueprint.modifiers[item._Item.slot]) {
            
                return blueprint.modifiers[item._Equippable.slot];    
            
            } 
            // otherwise we check if we have modifiers for the items equipment
            // group e.g. armor
            else if (blueprint.modifiers[item._Equippable.group]) {
            
                return blueprint.modifiers[item._Equippable.group];    
            
            }
            // finally we check if there are default modifiers (if any)
            else {
            
                return blueprint.modifiers.default;
            
            }
        
        }

        this.socketInto = function(item) {
        
            var modifiers = this.modifiers(item);
            
            if (modifiers) {
            
                for (var i = 0; i < modifiers.length; i++) {
                
                    item._Item.addModifier(modifiers[i]);
                
                }
            
            }            
        
        }
        
        this.

        entity.observe('socket', function socketableComponentOnSocket(ev) {
        
            this.socketInto(ev.payload.item);    
        
        }, this);
        
        entity.observe('unsocket', function socketableComponentOnUnsocket(ev) {
        
            this.unsocketFrom(ev.payload.item);    
        
        }, this);
        
    }

}
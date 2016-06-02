"use strict";

module.exports = function ShieldComponentFactory() {

    return ShieldComponent;

    function ShieldComponent(entity, blueprint) {

        this.blockChance = blueprint.blockChance || 0;
        this.blockAmount = blueprint.blockAmount || 0;
        
        entity.observe('shield_changed', function shieldComponentOnShieldChanged(ev) {
        
            this.blockChance = ev.payload.blockChance;
            this.blockAmount = ev.payload.blockAmount;
        
        }, this);
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function shieldComponentOnIncomingDamage(ev) {
        
            var blocked = Math.random() <= this.blockChance, 
                newDamage;
            
            if (blocked) {
            
                newDamage = ev.payload.damge - this.blockAmount;
                
                if (newDamage > 0) {
                
                    ev.payload.damage = newDamage;
                
                } else {
                
                    ev.stop = true;
                
                }

                entity.notify('incoming_damage_blocked');
            
            }
        
        }, this);
    
    }

}
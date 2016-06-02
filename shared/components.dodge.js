"use strict";

module.exports = function DodgeComponentFactory() {

    return DodgeComponent;

    function DodgeComponent(entity, blueprint) {

        this.dodgeChance = blueprint.dodgeChance || 0;
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function dodgeComponentOnIncomingDamage(ev) {
        
            var dodged = Math.random() <= this.dodgeChance;
            
            if (dodged) {
            
                ev.stop = true;
                
                entity.notify('incoming_damage_dodged');
            
            }
        
        }, this);
    
    }

}
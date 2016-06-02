"use strict";

module.exports = function ResistancesComponentFactory(Config) {

    return ResistancesComponent;

    function ResistancesComponent(entity, blueprint) {

        this.resistances = blueprint.resistances || {};
        
        this.damageReduction = function(damageType, damageSourceLevel) {
        
            var resistance = this.resistances[damageType] || 0;
        
            return resistance / (Config.resistanceAttenuationRate * damageSourceLevel) + resistance;

        };
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function resistancesComponentOnIncomingDamage(ev) {
                d = R /(5v + R)
            var dodged = Math.random() <= this.dodgeChance;
            
            if (dodged) {
            
                ev.stop = true;
                
                entity.notify('incoming_damage_dodged');
            
            }
        
        }, this);
    
    }

}
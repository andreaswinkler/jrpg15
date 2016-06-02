"use strict";

module.exports = function ArmorComponentFactory(Config) {

    return ArmorComponent;

    function ArmorComponent(entity, blueprint) {

        this.totalArmor = blueprint.totalArmor || 0;
        
        this.damageReduction = function(damageSourceLevel) {
        
            return this.totalArmor / (Config.armorAttenuationRate * damageSourceLevel + this.totalArmor);

        };
        
        this.setArmor = function(newArmor) {
        
            this.totalArmor = newArmor;        
        
        };
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function armorComponentOnIncomingDamage(ev) {
        
            var damageReduction = this.damageReduction(ev.payload.sourceLevel), 
                newDamage = ev.payload.damage - ev.payload.damage * damageReduction;
            
            // we update the damage from the event so the next handler 
            // only needs to deal with the reduced damage
            ev.payload.damage = newDamage;
        
        }, this);
        
        entity.observe('armor_changed', function armorComponentOnArmorChanged(ev) {
        
            this.setArmor(ev.payload.armor);
        
        }, this);
    
    }

}
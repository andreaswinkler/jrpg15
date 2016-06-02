"use strict";

module.exports = function DamageComponentFactory() {

    return DamageComponent;

    function DamageComponent(entity, blueprint) {

        this.baseDamage = blueprint.baseDamage || 0;
        this.minimumDamage = 0;
        this.maximumDamage = 0;
        
        this.damage = function() {
        
            if (this.minimumDamage > 0 && this.maximumDamage > 0) {
            
                return Math.random() * (this.maximumDamage - this.minimumDamage) + this.minimumDamage;   

            } else {
            
                return this.baseDamage;
            
            }
        
        };
        
        entity.observe('minimumDamage_changed', function damageComponentOnMinimumDamageChanged(ev) {
        
            this.minimumDamage = ev.payload.minimumDamage;
        
        }, this);
        
        entity.observe('maximumDamage_changed', function damageComponentOnMaximumDamageChanged(ev) {
        
            this.maximumDamage = ev.payload.maximumDamage;
        
        }, this);
    
    }

}
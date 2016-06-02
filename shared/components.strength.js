"use strict";

module.exports = function StrengthComponentFactory(Config) {

    return StrengthComponent;

    function StrengthComponent(entity, blueprint) {

        this.setStrength = function(newStrength) {
        
            this.Strength = newStrength;
        
        }
        
        this.setStrength(blueprint.Strength || 0);
        
        entity.observe('strength_change', function StrengthComponentOnStrengthChange(ev) {
        
            this.setStrength(ev.payload.Strength);
        
        });
    
    }

}
"use strict";

module.exports = function VitalityComponentFactory(Config) {

    return VitalityComponent;

    function VitalityComponent(entity, blueprint) {

        this.setVitality = function(newVitality, heal) {
        
            this.vitality = newVitality;
            
            entity._Health.setTotalHealth(this.vitality * Config.vitalityTotalHealthRatio, heal == true);
        
        }
        
        this.setVitality(blueprint.vitality || 0, true);
        
        entity.observe('vitality_change', function vitalityComponentOnVitalityChange(ev) {
        
            this.setVitality(ev.payload.vitality);
        
        });
    
    }

}
"use strict";

module.exports = function IntelligenceComponentFactory(Config) {

    return IntelligenceComponent;

    function IntelligenceComponent(entity, blueprint) {

        this.setIntelligence = function(newIntelligence) {
        
            this.intelligence = newIntelligence;
            
            entity._Energy.setTotalEnergy(this.intelligence * Config.intelligenceTotalEnergyRatio);
        
        }
        
        this.setIntelligence(blueprint.intelligence || 0);
        
        entity.observe('intelligence_change', function intelligenceComponentOnIntelligenceChange(ev) {
        
            this.setIntelligence(ev.payload.intelligence);
        
        });
    
    }

}
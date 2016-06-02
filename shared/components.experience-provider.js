"use strict";

module.exports = function ExperienceProviderComponentFactory() {

    return ExperienceProviderComponent;

    function ExperienceProviderComponent(entity, blueprint) {

        this.level = blueprint.level || 1;

        this.experience = function() {
            
            return this.level * this.level * ((blueprint || {}).baseExperience || 1);
        
        };
    
    }

}
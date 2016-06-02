"use strict";

module.exports = function ExperienceComponentFactory() {

    return ExperienceComponent;

    function ExperienceComponent(entity, blueprint) {

        function calculateLevel(experience, levels) {
        
            for (var i = 0; i < levels.length; i++) {
            
                if (experience < levels[i]) {
                
                    return i;
                
                }
            
            } 
            
            return -1;               
        
        }

        this.experience = blueprint.experience || 0;
        this.levels = blueprint.levels || [];
        this.level = calculateLevel(this.experience, this.levels);
        
        this.gain = function(experience) {
        
            var level;
        
            this.experience += experience;
            
            level = calculateLevel(this.experience, this.levels);
            
            if (level > this.level) {
            
                this.level = level;
                
                entity.notify('level_up');
            
            }
        
        }
        
        // we register ourselves for any kill events targeted 
        // at our parent entity
        entity.observe('kill', function experienceComponentOnKill(ev) {
        
            var experience = ev.payload.killedEntity._ExperienceProvider.experience();
            
            console.log('we killed something and gained ', experience);
            
            this.gain(experience);
        
        }, this);
    
    }

}
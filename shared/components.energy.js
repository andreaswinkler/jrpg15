"use strict";

module.exports = function EnergyComponentFactory() {

    return EnergyComponent;

    function EnergyComponent(entity, blueprint) {

        this.totalEnergy = blueprint.totalEnergy || 0;
        this.currentEnergy = blueprint.totalEnergy || this.totalEnergy;
        this.energyPerSecond = blueprint.energyPerSecond || 0;
        this.currentEnergyPerSecond = blueprint.currentEnergyPerSecond || this.energyPerSecond;
        
        this.update = function(ticks) {
            
            this.setEnergy(this.currentEnergy + (ticks / 1000 * this.currentEnergyPerSecond));
        
        }; 
        
        this.setEnergy = function(newEnergy) {
        
            this.currentEnergy = Math.min(newEnergy, this.totalEnergy);
        
        };
        
        this.setTotalEnergy = function(newTotalEnergy, fillUp) {
        
            this.totalEnergy = newTotalEnergy;
            
            if (fillUp) {
            
                this.currentEnergy = this.totalEnergy;
            
            }
        
        };  

        // set the currentLifePerSecond
        this.setCurrentEnergyPerSecond = function(newCurrentEnergyPerSecond) {
        
            this.currentEnergyPerSecond = newCurrentEnergyPerSecond;
            
            entity.unobserveFrame(this.update, this);
            
            if (this.currentEnergyPerSecond != 0) {
            
                entity.observeFrame(this.update, this);
            
            } 
        
        }

        this.setCurrentEnergyPerSecond(this.currentLifePerSecond);

        // we register ourselves for any energy_change events targeted 
        // at our parent entity
        entity.observe('energy_change', function(ev) {
        
            this.setEnergy(this.currentEnergy + ev.payload.change);
        
        }, this); 
    
    }

}
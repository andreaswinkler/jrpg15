"use strict";

module.exports = function HealthComponentFactory() {

    return HealthComponent;

    function HealthComponent(entity, blueprint) {

        this.totalHealth = blueprint.totalHealth || 0;
        this.currentHealth = blueprint.currentHealth || this.totalHealth;
        this.lifePerSecond = blueprint.lifePerSecond || 0;
        this.currentLifePerSecond = blueprint.currentLifePerSecond || this.lifePerSecond;
        
        this.update = function(ticks) {
            
            this.setHealth(this.currentHealth + (ticks / 1000 * this.currentLifePerSecond));
        
        }; 
        
        this.setHealth = function(newHealth) {
        
            this.currentHealth = Math.min(newHealth, this.totalHealth);
            
            if (this.currentHealth <= 0) {
            
                entity.notify('zero_health');
            
            }
        
        };
        
        this.setTotalHealth = function(newTotalHealth, heal) {
        
            this.totalHealth = newTotalHealth;
            
            if (heal) {
            
                this.currentHealth = this.totalHealth;
            
            }
        
        };  

        // set the currentLifePerSecond
        this.setCurrentLifePerSecond = function(newCurrentLifePerSecond) {
        
            entity.unobserveFrame(this.update, this);
        
            this.currentLifePerSecond = newCurrentLifePerSecond;
            
            if (this.currentLifePerSecond != 0) {
            
                entity.observeFrame(this.update, this);
            
            } 
        
        }

        this.setCurrentLifePerSecond(this.currentLifePerSecond);

        // we register ourselves for any health_change events targeted 
        // at our parent entity
        entity.observe('health_change', function healthComponentOnHealthChange(ev) {
        
            this.setHealth(this.currentHealth + ev.payload.change);
        
        }, this);
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function healthComponentOnImcomingDamage(ev) {
        
            entity.notify('health_change', { change: ev.payload.damage * -1 });
            
            if (this.currentHealth <= 0) {
            
                ev.payload.source.notify('kill', { killedEntity: entity });
            
            }
        
        }, this);
    
    }

}
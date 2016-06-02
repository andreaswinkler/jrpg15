"use strict";

module.exports = function AggroComponentFactory(Utils) {

    return AggroComponent;

    function AggroComponent(entity, blueprint) {

        this.range = blueprint.range || 0;
        this.target = null;
        
        this.setTarget = function(newTarget) {
            
            this.target = newTarget;
            
            entity.notify('new_aggro_target', { target: this.target });
        
        }        
        
        entity.observeAll('position_changed', function aggroComponentOnPositionChanged(ev) {
        
            var distance;
            
            // we don't aggro ourselves!
            if (ev.target !== entity) {
            
                distance = Utils.distance(entity.x, entity.y, ev.target.x, ev.target.y);
                
                if (distance <= this.range) {
                
                    this.setTarget(ev.target);
                
                }  
            
            }  
        
        }, this);
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function aggroComponentOnIncomingDamage(ev) {
        
            // if we are attacked by someone we set the aggro on him if 
            // we don't have one already
            if (!this.target) {
            
                this.setTarget(ev.payload.source);
            
            }
        
        }, this);
    
    }

}
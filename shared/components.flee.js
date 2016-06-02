"use strict";

module.exports = function FleeComponentFactory(Utils) {

    return FleeComponent;

    function FleeComponent(entity, blueprint) {

        this.distance = blueprint.distance || 0;
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('incoming_damage', function fleeComponentOnImcomingDamage(ev) {
        
            var v = Utils.unitVector(entity, ev.payload.source), 
                x = entity.x + (this.distance * v[0]), 
                y = entity.y + (this.distance * v[1]);
        
            entity.notify('new_target', { x: x, y: y });          
        
        }, this);
    
    }

}
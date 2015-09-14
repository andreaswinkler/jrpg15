"use strict";

module.exports = function(Entity) {

    return {

        ticks: 0,
        seconds: 0,  

        /* SETTICKS
        */
        setTicks: function(ticks) {
        
            this.ticks = ticks;
            this.seconds = ticks / 1000;
        
        }, 

        /* RUN
        *  here we handle a full entity (hero, creature)
        */
        runEntity: function(entity, map) {
        
            entity._changes = null;

            // life per second 
            if (entity._c.life < entity.life && entity.lifePerSecond > 0) {
            
                Entity.changeLife(entity, entity.lifePerSecond * this.seconds);
            
            } 
            
            // move
            if (entity.target) {
            
                Entity.move(entity, this.ticks, map.grid); 
            
            }
        
        }    

    };

};

"use strict";

module.exports = function(_, Entity, Core) {

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
        
            // first we handle any inputs we might have
            if (entity._inputs && entity._inputs.length > 0) {
            
                Entity.inputs(entity, map);
            
            }
        
            if (entity.isDead) {
            
                return;
            
            }

            // skill cooldowns
            if (entity.skills) {
            
                _.each(entity.skills, function(skill) {
                
                    if (skill._cooldown) {
                    
                        skill._cooldown = Math.max(0, skill._cooldown - this.seconds);
                    
                    }
                
                }, this);
            
            }
            
            // deferred attacks
            if (entity._skill) {
            
                Entity.deferredSkill(entity, this.ticks, map);
            
            }

            // aggro handling
            if (entity.aggroRange) {
            
                Entity.aggro(entity, map, this.ticks);
            
            }

            // life per second 
            if (entity._c.life < entity.life && entity._c.lifePerSecond > 0) {
            
                Entity.changeLife(entity, entity._c.lifePerSecond * this.seconds);
            
            } 
            
            // move
            if (entity.target) {
            
                Entity.move(entity, this.seconds, map); 
            
            }
            
            // auto-pickup
            if (entity._c.pickUpRange) {
            
                Entity.autoPickUp(entity, entity._c.pickUpRange, map);
            
            }
        
        }, 
        
        /* RUNPROJECTILE
        *
        */
        runProjectile: function(projectile, map) {
        
            if (projectile._targets) {
                
                Entity.hitTestTargets(projectile, projectile._targets);
            
            }
        
            if (projectile.target) {
            
                Entity.move(projectile, this.seconds, map);
                
                if (!projectile.target) { 
                    
                    Entity.change(projectile, 'isDead', true);
                
                }
            
            }   
        
        }            

    };

};

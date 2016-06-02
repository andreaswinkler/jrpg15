"use strict";

module.exports = function MoveComponentFactory(Utils, Game) {

    return MoveComponent;

    function MoveComponent(entity, blueprint) {

        var Target = function(x, y, tx, ty, range, infinitely) {
        
            var distance = Utils.distance(x, y, tx, ty);
        
            this.x = tx;
            this.y = ty;
            this.dx = (tx - x) / distance;
            this.dy = (ty - y) / distance;
            this.range = range || distance;
            this.infinitely = infinitely || false; 
            
            this.checkRange = function(nx, ny) {
            
                return !this.infinitely && 
                       Utils.distance(this.x, this.y, nx, ny) <= this.range;    
            
            };       
        
        };
    
        this.speed = blueprint.speed || 0;
        this.currentSpeed = blueprint.currentSpeed || this.speed;
        this.target = null;
    
        this.isMoving = function() {
        
            return this.target != null;
        
        }
    
        this.move = function(ticks) {
        
            var distance = this.currentSpeed * ticks, 
                nx = entity.x + this.target.dx * distance, 
                ny = entity.y + this.target.dy * distance;
            
            // we calculated our desired position, let's see if we can get there
            // we need lots of information to do so, so we delegate to the Engine
            if (Game.validatePosition(entity, nx, ny)) {
            
                entity.x = nx;
                entity.y = ny;    
                
                if (!this.target.checkRange(nx, ny)) {
                
                    entity.notify('target_reached');
                    
                    if (entity.is('hero')) {
                    
                        entity.notify('hero_target_reached');
                    
                    }
                
                    this.stop();
                
                }
            
            }           
        
        }
        
        this.stop = function() {
        
            this.target = null;
            
            entity.unobserveFrame(this.move, this);
        
        }
        
        this.moveTo = function(x, y, range, infinitely) {
        
            // we got a new position to move to, let's stop and consider
            this.stop();
        
            // make sure we have to move at all
            if (x != entity.x || y != entity.y) {
            
                this.target = new Target(entity.x, entity.y, x, y, range, infinitely);  
                
                entity.observeFrame(this.move, this);
            
            }        
        
        }
        
        if (blueprint.target) {
        
            this.moveTo(blueprint.target.x, blueprint.target.y, blueprint.target.range, blueprint.target.infinitely);
        
        }
        
        // we register ourselves for any incoming_damage events targeted 
        // at our parent entity
        entity.observe('new_target', function moveComponentOnNewTarget(ev) {
        
            this.moveTo(ev.payload.x, ev.payload.y, ev.payload.range, ev.payload.infinitely);
        
        }, this);
    
    }

}
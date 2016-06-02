"use strict";

module.exports = function EntityFactory(Game, Components, Events, Utils) {

    var id = 0;

    return Entity;

    function Entity(blueprint) {

        this.id = ++id;
        this.name = blueprint.name || 'Entity#' + this.id;
        this.type = blueprint.type || 'none';
        this.x = blueprint.x || 0;
        this.y = blueprint.y || 0;
        
        this.setPosition = function(x, y) {
        
            if (Game.validatePosition(this, x, y)) {
            
                this.x = x;
                this.y = y;
            
            } 
        
        }
        
        this.is = function(type) {
        
            return this.type == type;    
        
        }
        
        this.notify = function(event, payload) {
        
            Events.notify(event, this, payload);    
        
        }
        
        this.observe = function(event, handler, context) {
        
            Events.observe(event, handler, context, this);
        
        }
        
        this.observeAll = function(event, handler, context) {
        
            Events.observe(event, handler, context);
        
        }
        
        this.unobserve = function(event, handler) {
        
            Events.unobserve(event, this, handler);
        
        }
        
        this.observeInRange = function(obj, range, handler, context) {
        
            this.observeFrame(function(ticks) {
            
                if (Utils.distance(this.x, this.y, obj.x, obj.y) <= range) {
                
                    handler.call(context);
                
                }
            
            }, this);
        
        }
        
        // helper function to ease definition of onFrame handlers
        this.observeFrame = function(handler, context) {

            Events.observeFrame(handler, context);
        
        }
        
        this.unobserveFrame = function(handler, context) {
        
            Events.unobserveFrame(handler, context);
        
        }
        
        this.removeComponent = function(componentKey) {
        
            this[componentKey] = null;
        
        }
        
        this.addComponent = function(componentKey, blueprint) {
        
            this[componentKey] = new Components[componentKey](this, blueprint);
        
        }
        
        for (var componentKey in blueprint.components) {
        
            this.addComponent(componentKey, (blueprint.components || {})[componentKey]);
        
        }
        
        this.observe('entity_remove', function(ev) {
        
            this.notify('entity_before_remove');
        
            console.log('remove entity received. ', this.name, '. unobserve everything');
            
            Events.unobserveAll(this);
        
        }, this);
        
        this.notify('entity_created');
    
    }

}
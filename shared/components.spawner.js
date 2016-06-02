"use strict";

module.exports = function SpawnerComponentFactory(Utils, Config) {

    return SpawnerComponent;

    function SpawnerComponent(entity, blueprint) {

        this.activationRadius = blueprint.activationRadius || Config.spawnerActivationRadius, 
        this.amount = blueprint.amount || 1;
        this.spawnBlueprint = blueprint.blueprint || '';
        this.rank = blueprint.rank || 'normal';

        // a spawner is activated once a player enters its activation radius
        this.activate = function() {
        
            for (var i = 0; i < this.amount; i++) {
            
                this.spawn();
            
            }
            
            // destroy the spawner
            entity.notify('entity_remove');     
        
        };
        
        this.spawn = function() {
        
            var settings = {
                x: entity.x, 
                y: entity.y
            };
        
            if (this.rank != 'normal') {
            
                settings._Rank = {
                    rank: this.rank
                };
            
            }
        
            entity.notify('entity_create', { blueprint: this.spawnBlueprint, settings: settings });
        
        };
        
        this.activation = function(ev) {
        
            var distance = Utils.distance(entity.x, entity.y, ev.target.x, ev.target.y);
            
            if (distance <= this.activationRadius) {
            
                this.activate();
            
            }    
        
        };

        // we look after any hero position changed events, so we can activate 
        // if we get in range
        entity.observeAll('hero_target_reached', this.activation, this);
    
    }

}
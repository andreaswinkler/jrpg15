"use strict";

module.exports = function MapComponentFactory(Config) {

    return MapComponent;

    function MapComponent(entity, blueprint) {

        // the entities list contains all entities bound to this map
        // this contains (not limited to):
        // players, creatures, interative objects, spawn points, etc
        this.entities = [];
        // the grid stores all tiles and whether they are walkable or not, 
        // their position and height (z)
        this.grid = blueprint.grid || [];
        
        this.addEntity = function(newEntity) {
        
            this.entities.push(newEntity);
            
            newEntity.observe(['entity_before_remove', 'leave_map'], function mapComponentOnEntityRemove(ev) {
            
                this.removeEntity(ev.target);
            
            }, this);
            
            console.log('entity added', this.entities.length);
        
        };
        
        this.removeEntity = function(entity) {
        
            for (var i = 0; i < this.entities.length; i++) {
                
                if (this.entities[i] === entity) {
                    
                    this.entities.splice(i, 1);
                    i--;
                
                }
            
            }
            
            console.log('entity removed', this.entities.length);
        
        };
        
        entity.observeAll(['entity_created', 'enter_map'], function(ev) {
        
            this.addEntity(ev.target);    
        
        }, this);
    
    }

}
"use strict";

module.exports = function CraftComponentFactory() {

    return CraftComponent;

    function CraftComponent(entity, blueprint) {

        this.craft = function(recipe) {
        
            entity.notify('entity_create', recipe.result);   
        
        };
        
    }

}
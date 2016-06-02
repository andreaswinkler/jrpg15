"use strict";

module.exports = function SalvageComponentFactory() {

    return SalvageComponent;

    function SalvageComponent(entity, blueprint) {

        this.canBeSalvaged = function(item) {
        
            // TODO: determine if item can be salvaged
            return true;
        
        };

        this.yield = function(item) {
        
            // TODO: calculate yield (array of items)
            return [];
        
        };

        this.salvage = function(item) {
        
            if (this.canBeSalvaged(item)) {
            
                var yield = this.yield(item);
                
                // destroy item
                item.notify('entity_remove');
            
            } else {
            
                entity.notify('item_cannot_be_salvaged');
            
            }       
        
        };
        
    }

}
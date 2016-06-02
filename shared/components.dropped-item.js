"use strict";

module.exports = function DroppedItemComponentFactory(Config) {

    return DroppedItemComponent;

    function DroppedItemComponent(entity, blueprint) {

        this.pickUp = function() {
        
            // we remove the dropped item component from our item 
            // and let our owner pick us up
            entity.removeComponent('_DroppedItem');
        
            entity._Item.owner.notify('item_pickup', { item: entity });
        
        };

        if (blueprint.autoPickup) {
            
            entity._Item.owner.observeInRange(entity, Config.autoPickupRange, this.pickUp, this);
        
        }
        
        entity.observe('click', function droppedItemComponentOnClick(ev) {
        
            this.pickUp();  
        
        }, this);
        
    }

}
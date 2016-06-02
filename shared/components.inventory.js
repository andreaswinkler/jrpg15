"use strict";

module.exports = function InventoryComponentFactory() {

    return InventoryComponent;

    function InventoryComponent(entity, blueprint) {

        var Space = function(blueprint) {
        
            var SpaceItem = function(item, cell, width, height) {
            
                this.item = item;
                this.row = cell[0];
                this.col = cell[1];
                this.width = width;
                this.height = height;
                this.maxStack = item._Item.maxStack;
                this.stack = 1;
            
            };
        
            this.rows = blueprint.rows || 0;
            this.cols = blueprint.cols || 0;
            this.spaceItems = [];
            
            // find a stack of items that share the items type
            this.findSpaceItemStack = function(item) {
            
                for (var i = 0; i < this.spaceItems.length; i++) {
                
                    if (this.spaceItems[i].stack < this.spaceItems[i].maxStack && this.spaceItems[i].item.type == item.type) {
                    
                        this.spaceItems[i];
                    
                    }
                
                }
            
            };
            
            this.getEmptyCells = function(item) {
            
                // todo get empty cells
            
            };
            
            this.addItem = function(item) {
            
                var spaceItemStack = this.findSpaceItemStack(item), 
                    cells;
                
                // we found a stack we can append the item to
                if (spaceItemStack) {
                
                    spaceItemStack.stack++;
                    
                    entity.notify('space_item_stack_increase', spaceItemStack);
                
                } 
                // there is no stack or the item is not stackable -> just 
                // put it onto the grid
                else {
                
                    cells = this.getEmptyCells(item);
                    
                    // we found enough space on the grid for our item
                    if (cells) {
                    
                        this.spaceItems.push(new SpaceItem(item, cells));
                        
                        entity.notify('space_item_added', { space: this });
                    
                    }
                    // there is not enough space
                    else {
                    
                        entity.notify('space_full', { item: item });
                    
                    }
                
                }
            
            };
        
        };
        
        this.spaces = {};
        
        this.addSpace = function(key, blueprint) {
        
            this.spaces[key] = new Space(blueprint);
        
        }

        for (var i = 0; i < blueprint.spaces.length; i++) {
        
            this.addSpace(blueprint.spaces[i].key, blueprint.spaces[i]);
        
        }
        
        // handle pickup events; they happen when the user clicks a dropped 
        // item and it should be put to the inventory tab
        entity.observe('item_pickup', function inventoryComponentOnItemPickup(ev) {
        
            this.tabs.inventory.addItem(ev.payload.item);
        
        });
    
    }

}
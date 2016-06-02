"use strict";

module.exports = function UnsocketComponentFactory() {

    return UnsocketComponent;

    function UnsocketComponent(entity, blueprint) {

        this.unsocketCost = function(item) {
        
            // TODO: calculate unsocket cost
            return { amount: 0 };
        
        };

        this.unsocket = function(item) {
        
            if (item.sockets) {
            
                for (var i = 0; i < item.sockets.length; i++) {
                
                    if (item.sockets[i] != null) {
                    
                        entity.notify('item_pickup', item.sockets[i]);
                        
                        item.sockets[i] = null;
                    
                    }    
                
                }
            
            }            
        
        };
        
    }

}
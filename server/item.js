"use strict";

module.exports = function(F, Library) {

    return {
    
        // create a specific item by providing a blueprint
        create: function(blueprintFlag, level, rank, quality) {
        
            var blueprint = Library.blueprint(blueprintFlag), 
                itemType = Library.itemTypeByBlueprint(blueprint), 
                level = level || 1, 
                rank = Utils.rank(rank || F.NORMAL), 
                quality = Utils.quality(quality || F.STANDARD); 

            return this.createItem(itemType, level, 0, 0, blueprint, rank, quality);
        
        }
    
    }    

};
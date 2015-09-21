"use strict";

module.exports = function(F, DropTables, Core) {

    return {
    
        // create a drop
        createDrop: function(lootable, magicFind, goldFind) {
        
                // get drop table for lootable
            var dropTable = DropTables[lootable.dropTable], 
                // get amount to drop
                amount = Core.randomInt(dropTable.amountMin, dropTable.amountMax);
        
        } 
    
    }    

};
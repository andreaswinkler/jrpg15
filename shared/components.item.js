"use strict";

module.exports = function ItemComponentFactory(_) {

    return ItemComponent;

    function ItemComponent(entity, blueprint) {

        this.inventorySize = blueprint.inventorySize || [1, 1];
        this.maxStackable = blueprint.maxStackable || 0;
        this.modifiers = blueprint.modifiers || {};
        this.rank = blueprint.rank || 'normal';
        this.level = blueprint.level || 1;
        this.requirements = _.extend({
                level: 1, 
                strength: 0, 
                dexterity: 0, 
                intelligence: 0, 
                swordMastery: 0, 
                bowMastery: 0
            }, blueprint.requirements);
        this.uniqueEquipped = blueprint.uniqueEquipped || false;
        this.accountBound = blueprint.accountBound || false;
        this.maxDurability = blueprint.maxDurability || 10;
        this.currentDurability = blueprint.currentDurability || this.maxDurability;
        this.name = blueprint.name || '';                
    
    }

}
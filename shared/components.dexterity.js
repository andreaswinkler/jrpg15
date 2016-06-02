"use strict";

module.exports = function DexterityComponentFactory(Config) {

    return DexterityComponent;

    function DexterityComponent(entity, blueprint) {

        this.setDexterity = function(newDexterity) {
        
            this.Dexterity = newDexterity;
        
        }
        
        this.setDexterity(blueprint.Dexterity || 0);
        
        entity.observe('dexterity_change', function DexterityComponentOnDexterityChange(ev) {
        
            this.setDexterity(ev.payload.Dexterity);
        
        });
    
    }

}
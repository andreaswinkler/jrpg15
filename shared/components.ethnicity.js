"use strict";

module.exports = function EthnicityComponentFactory() {

    return EthnicityComponent;

    function EthnicityComponent(entity, blueprint) {

        this.domain = blueprint.domain || 'none';
        this.creatureType = blueprint.creatureType || 'none';
    
    }

}
"use strict";

module.exports = function StatisticsComponentFactory() {

    return StatisticsComponent;

    function StatisticsComponent(entity, blueprint) {
        
        this.kills = blueprint.kills || {};
        
        this.count = function(obj, key) {
        
            if (!obj[key]) {
            
                obj[key] = 0;
            
            }
            
            obj[key]++;
        
        };
        
        this.countKill = function(domain, type, rank) {
        
            this.count(this.kills, domain);
            this.count(this.kills, type);
            this.count(this.kills, rank);
        
        };
        
        // we register ourselves for any kill events targeted 
        // at our parent entity
        entity.observe('kill', function statisticsComponentOnKill(ev) {
        
            var domain = ev.payload.killedEntity.domain, 
                type = ev.payload.killedEntity.type, 
                rank = ev.payload.killedEntity.rank;
                
            this.countKill(domain, type, rank);
            
            console.log(this.kills);
        
        }, this);
    
    }

}
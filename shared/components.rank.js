"use strict";

module.exports = function RankComponentFactory(Config) {

    return RankComponent;

    function RankComponent(entity, blueprint) {

        this.rank = blueprint.rank || 'normal';
        this.affixes = blueprint.affixes || [];

        this.affix = function(affix) {
        
            switch (affix.type) {
            
                case 'extra_health': 
                
                    entity._Health.setTotalHealth(entity._Health.totalHealth * Config.affixes.extraHealth.totalHealthMultiplier, true);
                
                    break;
                
                case 'strong':
                
                    entity._Damage.setBaseDamage(entity._Damage.baseDamage * Config.affixes.strong.baseDamageMultiplier);
                
                    break;
              
                case 'fast':
                
                    entity._Move.setSpeed(entity._Move.speed * Config.affixes.fast.speedMultiplier);
                
                    break;
            
            }
        
        };

        switch (this.rank) {
        
            case 'champion':
            
                this.affixes.push({ type: 'extra_health' });
            
                break;
        
        }
        
        for (var i = 0; i < this.affixes.length; i++) {
        
            this.affix(this.affixes[i]);
        
        }
    
    }

}
"use strict";

module.exports = function BalanceComponentFactory() {

    return BalanceComponent;

    function BalanceComponent(entity, blueprint) {

        this.balance = blueprint.balance || 0;
        
        this.pay = function(amount) {
        
            if (this.canAfford(amount)) {
            
                this.balance -= amount;
            
            } else {
            
                entity.notify('insufficient_funds');
            
            }
        
        };
        
        this.canAfford = function(amount) {
        
            return this.balance >= amount;
                
        };
        
        this.add = function(amount) {
        
            this.balance += amount;
        
        };
        
        entity.observe('gold_earned', function balanceComponentOnGoldEarned(ev) {
        
            this.add(ev.payload.amount);
        
        }, this);
    
    }

}
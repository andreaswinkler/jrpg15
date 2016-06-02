"use strict";

module.exports = function AttackComponentFactory(Utils) {

    return AttackComponent;

    function AttackComponent(entity, blueprint) {

        this.attacks = blueprint.attacks || [];
        this.target = null;
        this.stack = [];
        
        this.update = function(ticks) {
        
            var now = +new Date(), 
                i;
        
            // loop through the stack and check if an attack is ready to resolve
            for (i = 0; i < this.stack.length; i++) {
            
                if (this.stack[i].resolveTimestamp <= now) {
                
                    this.resolveAttack(this.stack[i].attack);
                    
                    // remove the attack from the stack
                    this.stack.splice(i, 1);
                    i--;
                
                }   
            
            }
            
            // loop through all attacks and reduce cooldowns
            for (i = 0; i < this.attacks.length; i++) {
            
                this.attacks[i].currentCooldown = Math.max(0, (this.attacks[i].currentCooldown || 0) - ticks);
            
            }
            
            // if we have a target we try to attack it
            if (this.target != null) {
            
                this.attack();
            
            }
        
        };
        
        this.chooseAttack = function() {
        
            var distance = Utils.distance(entity, target);
            
            for (var i = 0; i < this.attacks.length; i++) {
            
                if (!this.attacks[i].currentCooldown && this.attacks[i].range >= distance) {
                
                    return this.attacks[i];
                
                }
            
            }
        
        };
        
        this.resolveAttack = function(attack) {
        
            var damage = entity._Damage.damage() * attack.damageMultiplier;
        
            if (attack.ranged) {
                
                entity.notify('entity_create', { blueprint: attack.blueprint, settings: {
                    x: entity.x, 
                    y: entity.y, 
                    '_Move': { 
                        target: { 
                            x: this.target.x, 
                            y: this.target.y, 
                            range: attack.range 
                        }
                    }, 
                    '_Damage': {
                        baseDamage: damage
                    }
                } });
            
            } else {
            
                this.target.notify('incoming_damage', damage);
            
            }    
        
        };
        
        this.attack = function() {
        
            var attack = this.chooseAttack(), 
                blueprint;
            
            if (attack) {
            
                // stack an attack and tell the component when to actually 
                // perform the attack
                this.stack.push({ 
                    resolveTimestamp: +new Date() + (attack.launchAttackAfterTicks || 0), 
                    attack: attack 
                });
                
                // set the cooldown in ms
                attack.currentCooldown = attack.cooldown;
            
            }
        
        };
        
        this.setTarget = function(newTarget) {
        
            this.target = newTarget;
            
            entity.observeFrame(this.update, this);
        
        };
        
        // if we get hit by something we cancel all attacks by clearing our 
        // attack stack
        this.cancelAttacks = function() {
        
            this.stack = [];
        
        };
        
        entity.observe('new_attack_target', function attackComponentOnAttackTarget(ev) {
        
            this.setTarget(ev.payload.target);
        
        }, this);
        
        entity.observe('incoming_damage', this.cancelAttacks, this);
    
    }

}
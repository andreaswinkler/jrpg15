"use strict";

module.exports = function EquipmentComponentFactory(Utils) {

    return EquipmentComponent;

    function EquipmentComponent(entity, blueprint) {

        this.slots = {
            head: {}, 
            chest: {}, 
            neck: {},  
            belt: {}, 
            pants: {}, 
            boots: {}, 
            bracers: {}, 
            shoulders: {}, 
            gloves: {}, 
            ring1: {}, 
            ring2: {},  
            weapon1: {}, 
            weapon2: {}, 
            offhand1: {}, 
            offhand2: {}, 
            token1: {}, 
            token2: {}, 
            token3: {} 
        };
        
        this.activeWeaponSlot = this.slots.weapon1;
        this.activeOffhandSlot = this.slots.offhand1;
        
        // the aggregated modifiers of all equipment items
        this.modifiers = {};

        // equip an item and raise an event if an item was replaced
        this.equip = function(item) {
        
            var slot = this.determineSlot(item);
            
            if (slot) {
            
                if (slot.item) {
                
                    entity.notify('unequip', { item: slot.item });
                
                }
                
                slot.item = item;
                
                this.refreshModifiers();
            
            }
        
        };
        
        this.unequip = function(item) {
        
            var slot = this.determineSlot(item);
            
            item.unobserve('change', this.refreshModifiers);
            
            if (slot) {
            
                slot.item = null;
            
            }
            
            this.refreshModifiers();
        
        };

        this.refreshModifiers = function() {
        
            this.modifiers = {};
        
            for (var slotKey in this.slots) {
            
                if (['weapon1', 'weapon2', 'offhand1', 'offhand2'].indexOf(slotKey) == -1 && this.slots[slotKey].item) {
                
                    Utils.extendAdditive(this.modifiers, this.slots[slotKey].item.modifiers);      
                
                }
            
            }
            
            if (this.activeWeaponSlot.item) {
            
                Utils.extendAdditive(this.modifiers, this.activeWeaponSlot.item.modifiers);
            
            }
            
            if (this.activeOffhandSlot.item) {
            
                Utils.extendAdditive(this.modifiers, this.activeOffhandSlot.item.modifiers);
            
            }
            
            for (var key in this.modifiers) {
            
                var payload = {};
                
                payload[key] = this.modifiers[key];
            
                entity.notify(key + '_changed', payload);
            
            }
        
        };
        
        this.determineSlot = function(item) {
        
            switch (item.slot) {
            
                case 'weapon':
                
                    return this.activeWeaponSlot;
                
                    break;  
                
                case 'offhand':
                
                    return  this.activeOffhandSlot;
                    
                    break;
                
                default:
                
                    return this.slots[item.slot];
                    
                    break;          
            
            }
        
        };
        
        this.weapon = function() {
        
            return this.activeWeaponSlot.item;
        
        };
        
        this.offhand = function() {
        
            return this.activeOffhandSlot.item;
        
        };
        
        // toggle weapon/offhand slots
        this.toggle = function() {
        
            if (this.activeWeaponSlot == this.slots.weapon1) {
            
                this.activeWeaponSlot = this.slots.weapon2;
                this.activeOffhandSlot = this.slots.offhand2;
            
            } else {
            
                this.activeWeaponSlot = this.slots.weapon1;
                this.activeOffhandSlot = this.slots.offhand1;    
            
            }
            
            this.refreshModifiers();
        
        };

        entity.observe('equip', function equipmentComponentOnEquip(ev) {
        
            var item = ev.payload.item;
            
            this.equip(item);
        
        }, this);
        
        entity.observe('unequip', function equipmentComponentOnUnequip(ev) {
        
            var item = ev.payload.item;
            
            this.unequip(item);
        
        }, this);
        
        entity.observe('key_combatSetupToggle', function equipmentComponentOnCombatSetupToggle(ev) {
        
            this.toggle();
        
        }); 
    
    }

}
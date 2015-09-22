"use strict";

module.exports = function(_, F, DropTables, Blueprints, GemRanks, ItemRanks, ItemQualities, ItemAffixes, Core) {

    return {
    
        // return a random element from the list filter by min/max level
        selectByLevel: function(list, level) {
        
            return Core.randomElement(this.selectAllByLevel(list, level));
        
        }, 
        
        selectAllByLevel: function(list, level) {
        
            return _.filter(list, function(i) {
            
                return i.minLevel <= level && i.maxLevel >= level;
            
            });
        
        }, 
    
        // create a pile of gold
        createGold: function(amount) {
        
            var pileOfGold = Core.clone(Blueprints.gold);
            
            pileOfGold.amount = amount;

            return pileOfGold; 
        
        }, 
    
        // create a gold drop
        createGoldDrop: function(level, goldFind) {
        
            // the amount of gold is calculated based on the level
            // min: level, max: level^3 
            // the result is multiplied by the given gold find bonus
            var amount = Core.randomInt(level, Math.pow(level, 3)) * goldFind; 
            
            return this.createGold(amount);   
        
        }, 
    
        // create a gem
        createGem: function(type, rank) {
        
            var gem = Core.clone(Blueprints[type]);
            
            gem.rank = rank;
            
            return gem;    
        
        }, 
    
        // create a gem drop
        createGemDrop: function(type, level) {
        
            var gemRank = this.selectByLevel(GemRanks, level);
            
            if (gemRank) {
            
                return this.createGem(type, gemRank.rank);
            
            }
            
            return null;
        
        }, 
        
        normalItem: function(item) {
        
            var quality = Core.randomWeightedElement(ItemQualities), 
                sockets = Core.randomInt(0, item.maxSockets);
            
            item.quality = quality.quality;
            item.name = quality.prefix + item.name;
            
            if (item.minDmg) {
            
                item.minDmg = Math.max(1, ~~(item.minDmg * quality.dmgMultiplier));
                item.maxDmg = Math.max(1, ~~(item.maxDmg * quality.dmgMultiplier));
            
            }
            
            if (item.armor) {
            
                item.armor = Math.max(1, ~~(item.armor * quality.armorMultiplier));
            
            }
            
            if (item.durability) {
            
                item.durability = Math.max(1, ~~(item.durability * quality.durabilityMultiplier));
            
            }
            
            if (sockets > 0) {
            
                item.sockets = [];
            
                for (i = 0; i < sockets.length; i++) {
                
                    item.sockets.push(null);    
                
                }    
            
            }
            
            return item;
        
        }, 
        
        affixItem: function(item) {
        
            var affix;
        
            if (item.affixes == 1) {
            
                this.addAffix(item, Math.random() >= 0.5 ? F.SECONDARY : F.PRIMARY);
            
            } else {
        
                for (var i = 0; i < item.affixes; i++) {
                
                    this.addAffix(item, i % 2 ? F.SECONDARY : F.PRIMARY);
                
                }
            
            }
            
            // we have a magic item with one (primary) affix, let's prepend
            // the affix to the item name
            if (item._affixes.length == 1) {
            
                item.name = item._affixes[0].name.replace('#', item.name);
            
            } 
            // we have a magic item with two affixes, let's prepend the 
            // primary and append the secondary 
            else if (item._affixes.length == 2) {
            
                item.name = item._affixes[0].name.replace('#', item.name);
                item.name = item._affixes[1].name.replace('#', item.name);    
            
            }
            // otherwise we have a rare item and create a random rare name
            else {
            
                item.name = this.selectRareName(item);
            
            }
            
            return item;
            
        },
        
        selectRareName: function(item) {
        
            return 'Vile Ward';    
        
        }, 
        
        addAffix: function(item, secondary) {
        
            var affix = this.getAffix(item.type, item.level, secondary);
        
            if (!item._affixes) {
            
                item._affixes = [];
            
            }
            
            item._affixes.push(affix);
            
            if (item._affixes.length <= 2) {
            
                item.name = affix.name.replace('#', item.name);    
            
            } else {
            
                item.name 
            
            }
        
        },  
        
        
        getAffix: function(type, level, rank) {
        
            return Core.randomWeightedElement(_.filter(ItemAffixes, function(i) {
            
                return i[0].rank == rank && i[2].minLevel <= level && i[2].maxLevel >= level && i[2].type == type;
            
            }));    
        
        }, 
        
        selectRarity: function(level) {
        
            return Core.randomWeightedElement(_.filter(ItemRarities, function(i) { 
                
                // we include only rarities available for this level 
                return i[2].minLevel <= level && i[2].maxLevel >= level;  
            
            })); 
        
        }, 
        
        // create an item
        createItem: function(type, rank, level) {
        
            var item = Core.clone(Blueprints[type]), 
                rarity = this.selectRarity(level), 
                quality;
            
            // set the level of the item
            item.level = level;
            
            // specify the item by applying the rank settings
            // e.g. Small Sword < Sword < Curved Knife < ...    
            Core.extend(item, rank);
            
            // further specify the item by applying its rarity
            Core.extend(item, rarity);
            
            switch (item.rarity) {
            
                case F.NORMAL:
                
                    this.normalItem(item);
                
                    break;
                
                case F.MAGIC:
                case F.RARE:
                
                    this.affixItem(item, type);                  
                
                    break;
            
            }

            return item;
        
        }, 
        
        // create an item drop
        createItemDrop: function(type, level) {
        
            var itemRank = this.selectByLevel(ItemRanks, level).subtypes[type];
            
            if (itemRank) {
            
                return this.createItem(type, rank, level);
            
            }
        
            return null;
            
        }, 
    
        // create a single item for a drop
        createDropElement: function(type, level, magicFind, goldFind) {
        
            switch (Blueprints[type].type) {
            
                case F.GOLD:
                
                    return this.createGoldDrop(level, goldFind);
                    
                    break;
                
                case F.GEM:
                
                    return this.createGemDrop(type, level);
                
                    break; 
                
                default: 
                
                    return this.createItemDrop(type, level);
                
                    break;  
            
            }
        
        }, 
    
        // create a drop
        createDrop: function(lootable, magicFind, goldFind) {
        
                // get drop table for lootable
            var dropTable = DropTables[lootable.dropTable], 
                // get amount to drop
                amount = Core.randomWeightedElement(dropTable.amount), 
                drop = [], 
                item, i;
            
            // only proceed if we drop at least one piece
            if (amount > 0) {
            
                for (i = 0; i < amount; i++) {
                
                    item = this.createDropElement(
                        // specify the item type
                        Core.randomWeightedElement(dropTable.items), 
                        magicFind, 
                        goldFind 
                    );  
                    
                    // here we would handle double/combined drops 
                    // Broken Crown style
                    
                    // for various reasons it can happen that we don't get 
                    // back an item (e.g. level restrictions for an item type)
                    if (item) {
                    
                        drop.push(item);  
                    
                    }
                
                }            
            
            }
            
            return drop;
        
        } 
    
    }    

};
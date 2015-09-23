"use strict";

module.exports = function(_, F, DropTables, Blueprints, GemRanks, ItemRanks, ItemRarities, ItemQualities, ItemAffixes, Core) {

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
        
        /* SELECT RARITY
        *  select an item rarity based on level and magicFind
        *  the rarities are stored in the form
        *  [{RARITY}, {PROBABILITY}, {SETTINGS}]
        */   
        selectRarity: function(level, magicFind) {
        
            var list = [];
            
            _.each(ItemRarities, function(i) {
            
                // make sure the rarity is valid for the given level
                if (i[2].minLevel <= level && i[2].maxLevel >= level) {
                
                    // adjust the base probability (i[1]) with the given magic
                    // find value
                    // to allow for different effects of magic find on different 
                    // rarities, setings contain a probabilityMultiplier value 
                    // (0 = no effect of magic find, 
                    //  1 = linear effect of magic find, 
                    //  2 = double effect of magic find, etc)
                    list.push([
                        i[0], 
                        i[2].probabilityMultiplier > 0 ? 
                            i[1] * i[2].probabilityMultiplier * magicFind : 
                            i[1]
                    ]);
                
                }
            
            });
        
            return Core.randomWeightedElement(list);
        
        }, 
        
        /* CREATE ITEM
        *  create an item of given type, rank an level
        */
        createItem: function(type, rank, level, magicFind) {
        
            var item = Core.clone(Blueprints[type]), 
                rarity = this.selectRarity(level, magicFind), 
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
        
        /* CREATE ITEM DROP
        *  create a single weapon or armor or jewelry piece by type and level
        */
        createItemDrop: function(type, level, magicFind) {
        
            // choose a rank (e.g. small sword, sword, elite sword) based 
            // on the given level
            var itemRank = this.selectByLevel(ItemRanks, level).subtypes[type];
            
            // if an item rank for the given level and item type exists
            // create the item
            if (itemRank) {
            
                return this.createItem(type, itemRank, level, magicFind);
            
            }
        
            return null;
            
        }, 
    
        /* CREATE DROP ELEMENT
        *  create and return a single dropped item of a given type and level
        */        
        createDropElement: function(type, level, magicFind, goldFind) {
        
            switch (Blueprints[type].type) {
            
                case F.GOLD:
                
                    return this.createGoldDrop(level, goldFind);
                    
                    break;
                
                case F.GEM:
                
                    return this.createGemDrop(type, level);
                
                    break; 
                
                default: 
                
                    return this.createItemDrop(type, level, magicFind);
                
                    break;  
            
            }
        
        }, 
    
        /* CREATE DROP
        *  create a drop of items based on a lootable and the heroes
        *  current magic and gold find values   
        *  the method returns a list of items             
        */        
        createDrop: function(lootable, magicFind, goldFind) {

                // get drop table for lootable
            var dropTable = DropTables[lootable.dropTable], 
                // get amount to drop
                amount = Core.randomWeightedElement(dropTable.amount), 
                drop = [], 
                item, i;
            
            console.log('create drop', lootable.dropTable, magicFind, goldFind, amount);
            
            // only proceed if we drop at least one piece
            if (amount > 0) {
            
                for (i = 0; i < amount; i++) {
                
                    item = this.createDropElement(
                        // specify the item type
                        Core.randomWeightedElement(dropTable.items),
                        lootable.level,  
                        magicFind, 
                        goldFind 
                    );  
                    
                    // here we would handle double/combined drops 
                    // Broken Crown style
                    
                    // for various reasons it can happen that we don't get 
                    // returned an item (e.g. level restrictions for an 
                    // item type)
                    if (item) {
                    
                        drop.push(item);  
                    
                    }
                
                }            
            
            }
            
            return drop;
        
        } 
    
    }    

};
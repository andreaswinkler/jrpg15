"use strict";

/*
* Item Factory
*/
module.exports = function ItemFactoryFactory(Config, Utils, _) {

    return ItemFactory;

    function ItemFactory() {
      
        /*
        *  ItemFactory.create
        *  create an item object based on a blueprint
        *  
        *  Parameters: 
        *  blueprint (object) 
        *  magicFind (float)                                        
        */
        this.create = function(blueprint, magicFind) {
        
            // create the base item object from the blueprint and extend it 
            // by the item types' base parameters
            var level = blueprint.level || 1, 
                type = blueprint.type || this.randomType(level), 
                item = _.extend(
                    { level: level, type: type }, 
                    blueprint, 
                    Config.itemTypes[blueprint.type || this.random]
                );
            
            // if the item rank was not provided, get a random one
            if (!item.rank) {
            
                this.determineRank(item, magicFind);
            
            }
            
            // adjust the items' properties based on its rank
            this.applyRank(item);
            
            // if the item quality was not provided, get a random one
            if (!item.quality) {
            
                this.determineQuality(item);
            
            }
            
            // adjust the item's properties based on its quality
            this.applyQuality(item);
            
            // add and configure any affixes for the item
            this.determineAffixes(item, item.prefixes, 'prefix');
            this.determineAffixes(item, item.suffixes, 'suffix');
            
            // if the sockets are not set already, choose randomly how 
            // many the item has
            // determineSockets always resets the sockets on the item so we 
            // don't call it if we already got some
            if (!item.sockets) {
            
                this.determineSockets(item);
            
            }
            
            // adjust the name based on the items quality and rank
            this.determineName(item);
            
            // refresh modifiers (sums up all the affixes/prefixes/slots etc)
            this.refreshModifiers(item);
            
            return item;
        
        };
        
        // refresh modifiers (sums up all the affixes/prefixes/slots etc)
        this.refreshModifiers = function(item) {
        
            item.modifiers = {};
            
            // base attributes (weapons/armor)
            _.each(['minimumDamage', 'maximumDamage', 'attackSpeed', 'armor'], function(key) {
            
                if (item[key]) {
                
                    item.modifiers[key] = item[key];
                
                }    
            
            });
            
            // prefixes
            _.each(item.prefixes, function(prefix) {
            
                Utils.extendAdditive(item.modifiers, prefix.modifiers);
            
            });
            
            // suffixes
            _.each(item.suffixes, function(suffix) {
            
                Utils.extendAdditive(item.modifiers, suffix.modifiers);
            
            });
        
        };
        
        this.randomType = function(level) {
        
            return _.sample(_.filter(Config.itemTypes, function(i) {
            
                return i.minimumLevel <= level && i.maximumLevel >= level;
            
            })).key;
        
        };
        
        /*
        *  ItemFactory.determineSockets
        *  
        *  Parameters:
        *  item
        *  
        *  Assign a random amount of sockets to an item. This is only done if 
        *  the item is of normal rank (white item) or if there are affixes on 
        *  the item providing sockets                                                         
        */        
        this.determineSockets = function(item) {
        
            var amount = 0, 
                i;
        
            if (item.rank == 'normal') {
            
                amount = _.random(0, item.maxSockets);
            
            } else {
            
                _.each(item.suffixes, function(i) {
                
                    if (i.modifiers.sockets) {
                    
                        amount += i.modifiers.sockets;
                    
                    }
                
                });

            }

            item.sockets = [];
            
            for (i = 0; i < amount; i++) {
            
                item.sockets.push(null);
            
            }   
        
        };
        
        // set the item name and modify it's base attribute if necessary
        this.applyQuality = function(item) {
        
            var quality;
        
            // if we have an uncommon quality we want to adjust our modifiers
            if (item.quality != 'normal') {
            
                quality = _.find(Config.itemQualities, function(i) { 
                
                    return i.key == item.quality; 
                    
                });

                // adjust name
                item.name = quality.name + ' ' + item.name; 
                
                // adjust modifiers
                if (item.group == 'weapons') {
                
                    item.minimumDamage *= quality.minimumDamageMultiplier;
                    item.maximumDamage *= quality.maximumDamageMultiplier;    
                
                } else {
                
                    item.armor *= quality.armorMultiplier;
                
                }
                
                item.unrepairable = quality.unrepairable;
            
            }    
        
        };
        
        this.determineQuality = function(item) {
        
            item.quality = 'normal';
        
            // quality is only used on armor pieces and weaponary and 
            // only for normal (white) items
            if (item.rank == 'normal' && ['armor', 'weapons'].indexOf(item.group) != -1) {
                
                item.quality = this.randomQuality(item.level);
            
            } 
        
        };
        
        this.randomQuality = function(itemLevel) {
        
            var r = 0, //Math.random(), 
                qualities = _.filter(Config.itemQualities, function(i) {
                    
                    return itemLevel >= i.minimumLevel && r <= i.probability;
                
                });

            if (qualities.length > 0) {
            
                return _.sample(qualities).key;
            
            }
            
            return 'normal';
        
        };
        
        // determine the item name
        this.determineName = function(item) {
        
            switch (item.rank) {
            
                case 'magicPrefix':
                
                    item.name = item.prefixes[0].name + ' ' + item.name;
                
                    break;
                
                case 'magicSuffix':
                
                    item.name = item.name + ' ' + item.suffixes[0].name;
                
                    break;
                
                case 'magic2':
                
                    item.name = item.prefixes[0].name + ' ' + item.name + ' ' + item.suffixes[0].name;
                
                    break;
                
                case 'rare3':
                case 'rare4':
                case 'rare5':
                
                    item.name = _.sample(Config.rareNames[item.subgroup]);
                
                    break;
            
            }
        
        };
        
        // determine the items affixes
        this.determineAffixes = function(item, affixes, affixType) {
        
            for (var i = 0; i < affixes.length; i++) {
                
                // fill all empty slots with affixes
                if (affixes[i] == null) {
                
                    affixes[i] = this.randomAffix(item, affixType);
                
                } 
                // otherwise an affix key is specified, load the affix
                else {
                
                    affixes[i] = _.extend({}, _.find(Config.itemAffixes, function(a) { return a.key == affixes[i]; }));
                
                }
                
                // determine the exact affix values
                for (var modifierKey in affixes[i].modifiers) {
                    
                    affixes[i].modifiers[modifierKey] = _.random(
                        affixes[i].modifiers[modifierKey].min, 
                        affixes[i].modifiers[modifierKey].max
                    );        
                
                }
            
            }
        
        };
        
        // get a random affix and make sure it does not collide with existing
        // affixes on the item
        this.randomAffix = function(item, type) {
        
            var possibleAffixes = [], 
                existingAffixes = type == 'prefix' ? item.prefixes : item.suffixes;

            _.each(Config.itemAffixes, function(affix) {
        
                if (
                // check the affix group
                (item.group == affix.itemGroup) && 
                // check the affix type
                (type == affix.type) && 
                // check the item level against the affix requirements
                (item.level >= affix.minimumItemLevel && item.level <= affix.maximumItemLevel) && 
                // check the affix (or another one of the same group) is not on the item already
                (!_.find(existingAffixes, function(i) { return i && i.group == affix.group; }))
                ) {
                
                    possibleAffixes.push(affix);
                
                }
            
            });
            
            return _.extend({}, _.sample(possibleAffixes));
        
        };
        
        this.findSpecialItem = function(set, item) {
        
            var r = Math.random();

            return _.sample(_.filter(set, function(i) {
            
                return i.minimumLevel <= item.level && i.probability >= r;
            
            }));
        
        };
        
        this.applyRank = function(item) {
        
            var specialItem;
        
            if (item.rank != 'normal') {
            
                if (item.rank == 'mythic') {
                
                    specialItem = this.findSpecialItem(Config.mythicItems, item);
                
                } else if (item.rank == 'set') {
                
                    specialItem = this.findSpecialItem(Config.setItems, item);
                
                } else if (item.rank == 'legendary') {
                
                    specialItem = this.findSpecialItem(Config.legendaryItems, item);
                
                } 
                
                if (specialItem) {
                
                    item.name = specialItem.name;
                    item.prefixes = specialItem.prefixes;
                    item.suffixes = specialItem.suffixes;
                
                } 
                // we could not find a special item
                else {

                    // get the next lower rank. we assume they are ordered 
                    // descending in the config
                    _.each(Config.itemRanks, function(i, ind) {
         
                        if (i.rank == item.rank) {
                            
                            if (Config.itemRanks.length > ind + 1) {
                            
                                item.rank = Config.itemRanks[ind + 1].rank;
                            
                            } else {
                            
                                item.rank = 'normal';
                            
                            }    
                        
                        }    
                    
                    });

                    this.applyRank(item); 
                                
                }
            
            } else {

                item.prefixes = [];
                item.suffixes = [];    
            
            }
        
        };
        
        // determine the rank of the item
        // outcome can be:
        // mythic, legendary, set, rare, magic, normal
        // and is determined by level, availabilty on type, magicFind and luck
        this.determineRank = function(item, magicFind) {
        
            var r = Math.random();
            
            item.rank = 'normal';
            
            _.each(Config.itemRanks, function(rank) {

                if (
                // check level requirements
                item.level >= rank.minimumLevel && 
                // make sure the item type is not blocked for this rank
                rank.itemTypesBlacklist.indexOf(item.type) == -1 && 
                // make sure there is no white list or it includes the item type
                (rank.itemTypesWhitelist.length == 0 || rank.itemTypeWhitelist.indexOf(item.type) != -1) && 
                // check the probability
                r <= rank.probability * magicFind) {
                    
                    item.rank = rank.rank;
                    item.prefixes = rank.prefixes;
                    item.suffixes = rank.suffixes;
                    
                    return false;
                
                }
                         
            
            });
        
        };

    }

}
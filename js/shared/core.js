"use strict";

(function() {

    if (typeof _ === 'undefined') {
    
        if (typeof require !== 'undefined') {
    
            var _ = require('../underscore.min.js');
        
        } else if (this._) {
        
            var _ = this._;
        
        }
    
    } 
    
    var Core = {
    
        Flags: {
            WEAPON: 0, 
            ARMOR: 1, 
            JEWELRY: 2, 
            MATERIAL: 3, 
            ORNAMENT: 4, 
            UTILITY: 5, 
            QUEST: 6,
            OTHER: 7,
            ONEHAND: 8,
            TWOHAND: 9, 
            BELT: 10,
            HEADPIECE: 11,
            PANTS: 12,
            GLOVES: 13,
            SHOULDERS: 14,
            BRACERS: 15,
            OFFHAND: 16, 
            RING: 17,
            AMULET: 18, 
            TOKEN: 19, 
            BOOTS: 20,
            GEM: 21, 
            POTION: 22,
            RUNE: 23,
            HEALTHGLOBE: 24,
            CHESTARMOR: 25,
            SWORD: 26,
            STAFF: 27,
            BOW: 28,
            RUBY: 29,
            EMERALD: 30,
            TOPAZ: 31,
            AMETHYST: 32,
            SAPPHIRE: 33, 
            SMALLSWORD: 34,
            CHIPPED: 35,
            FLAWED: 36,
            NORMAL: 37,
            MAGIC: 38,
            RARE: 39,
            SET: 40,
            LEGENDARY: 41,
            ANCIENT: 42,
            ETHERAL: 43,
            GOLD: 44,
            HEALTHPOTION: 45,
            AUTOPICKUP: 46,
            FLAWLESS: 47,
            PERFECT: 48, 
            SOCKETED: 49, 
            INFERIOR: 50,
            GOOD: 51, 
            EXCEPTIONAL: 52, 
            STANDARD: 53, 
            ITEM: 54,
            HAND: 55, 
            EQUIPMENT: 56, 
            INVENTORY: 57, 
            STASH0: 58, 
            STASH1: 59,
            STASH2: 60, 
            STASH3: 61,
            DROP: 62,
            BLACKSMITH: 63, 
            VENDOR0: 64, 
            WEAPON1: 65, 
            WEAPON2: 66, 
            OFFHAND1: 67, 
            OFFHAND2: 68, 
            TOKEN1: 69, 
            TOKEN2: 70, 
            TOKEN3: 71, 
            RING1: 72, 
            RING2: 73,
            LANDINGPOINT: 74, 
            WALKABLE: 75, 
            SPAWNPOINT: 76, 
            HYSTRIX: 77, 
            BEAST: 78, 
            HUMAN: 79, 
            RANGED: 80, 
            MELEE: 81, 
            ELITE: 82, 
            CHAMPION: 83, 
            UNIQUE: 84,
            BOSS: 85, 
            ARROW: 86, 
            PHYSICAL: 87, 
            FIRE: 88, 
            COLD: 89, 
            POISON: 90, 
            LIGHTNING: 91, 
            FAST: 92, 
            EXTRAHEALTH: 93, 
            STRONG: 94, 
            CRITICAL: 95, 
            CRUSHINGBLOW: 96, 
            DODGED: 97, 
            LETHAL: 98, 
            IMMUNE: 99, 
            DEAD: 100, 
            HERO: 101, 
            EQUIPPED: 102, 
            INDESTRUCTIBLE: 103
        }, 
        
        Settings: null, 
    
        dt: 0, 
    
        init: function() {
        
            // pre-process the droptables
            _.each(this.Settings.droptables, function(dt) {
            
                _.each(dt.items, function(dti) {
    
                    dti[0] = this.Flags[dti[0].toUpperCase()];
                
                }, this);
            
            }, this);
            
            // pre-process the blueprints
            _.each(this.Settings.blueprints, function(bp) {
            
                for (var i = 0; i < bp[4].length; i++) {
                
                    bp[4][i] = this.Flags[bp[4][i].toUpperCase()];
                
                }
            
            }, this);
            
            // pre-process the affixes
            _.each(this.Settings.affixes.prefixes, function(a) {
            
                for (var i = 0; i < a[3].length; i++) {
                
                    a[3][i] = this.Flags[a[3][i].toUpperCase()];
                
                }
            
            }, this);
            
            // pre-process the affixes
            _.each(this.Settings.affixes.suffixes, function(a) {
            
                for (var i = 0; i < a[3].length; i++) {
                
                    a[3][i] = this.Flags[a[3][i].toUpperCase()];
                
                }
            
            }, this);
            
            _.each(this.Settings.itemRanks, function(i) {
            
                i[0] = this.Flags[i[0].toUpperCase()];
            
            }, this);
            
            _.each(this.Settings.itemQualities, function(i) {
            
                i[0] = this.Flags[i[0].toUpperCase()];
            
            }, this);
            
            _.each(this.Settings.creatures, function(c) {
            
                for (var i = 0; i < c[1].length; i++) {
                
                    c[1][i] = this.Flags[c[1][i].toUpperCase()];
                
                }
                
                for (var i = 0; i < c[2].skills.length; i++) {
                
                    for (var j = 0; j < c[2].skills[i][1].length; j++) {
                    
                        c[2].skills[i][1][j] = this.Flags[c[2].skills[i][1][j].toUpperCase()];
                    
                    }
                
                }
            
            }, this);
        
        }, 
    
        update: function(e) {
        
            if (e.target) {
            
                Core.Translate.byTarget(e);
            
            } 
        
        }, 
        
        prepareElement: function(e) {
        
            e.width = Core.Settings.assets[e.assetId].spriteDimensions[0];
            e.height = Core.Settings.assets[e.assetId].spriteDimensions[1];
            e.width_h = Math.floor(e.width / 2);
            e.height_h = Math.floor(e.height / 2);
            e.box = [0, 0, 0, 0];
            e.hitBox = [0, 0, 0, 0];

            e.is = function() {

                return Utils.is.apply(Utils, [this].concat([].slice.call(arguments)));
            
            };
            
            this.calculateCurrentAttributes(e);
            
            Core.Translate.update(e);
            
            return e;
        
        },
        
        // recalculate all current values from the base values
        calculateCurrentAttributes: function(e) {
        
            e.c = {};
        
            e.c.speed = e.speed;
            e.c.life = e.life;
            e.c.mana = e.mana;
            e.c.as = e.as;
        
            if (e.dmg) {
            
                e.c.minDmg = e.dmg;
                e.c.maxDmg = e.dmg;
            
            }
            
            if (e.vit) {
            
                e.c.vit = e.vit;
                e.c.dex = e.dex;
                e.c.int = e.int;
                e.c.str = e.str;
                e.c.armor = 0;

                e.life = e.c.life = e.c.vit * 5;
                e.mana = e.c.mana = e.c.int * 2.5;
            
                e.c.lps = Math.floor(e.c.vit / 10);
                e.c.mps = Math.floor(e.c.int / 10);
            
            } 
            
            if (e.equipment) {
            
                _.each(e.equipment, function(i) {
                
                    _.each(i[2].c, function(v, k) {
                        
                        e.c[k] = (e.c[k] || 0) + v;
                    
                    });
                
                });
            
            }
            
            if (e.is(F.HERO)) {
            
                // todo: this should be something meaningful
                e.c.toughness = e.c.life + e.c.armor;
                e.c.healing = e.c.lps + e.c.mps;
            
            }           
        
        }, 
        
        // check if the given position is on the map (nothing should get off
        // the map)
        validatePosition: function(x, y) {
        
            return x >= 0 && y >= 0 && x <= Game.state.map.width && y <= Game.state.map.height;
        
        }, 
        
        // grab a tile by a set of coordinates
        tile: function(x, y) {
        
            var t;
        
            // make sure the position is valid
            if (Core.validatePosition(x, y)) {
            
                t = Game.state.map.grid.tiles[Math.floor(y / 32) * Game.state.map.grid.cols + Math.floor(x / 64)];   
            
            } else {
            
                t = { walkable: false };
            
            }
            
            return t;      
        
        }, 
    
        Position: {
        
            update: function(e, x, y) {
            
                e.x = x;
                e.y = y;
                
                Core.Translate.update(e);
            
            }
        
        }, 
    
    //// M O V E M E N T    S E C T I O N //////////////////////////////////////////
        
        Translate: {
        
            // check if the position is valid and the given element 
            // can move to it
            canMoveTo: function(x, y, e) {
            
                return Core.tile(x, y).walkable;
            
            }, 
        
            // change an elements position by offsets in both directions  
            by: function(e, dx, dy) {
            
                var d = 0, 
                    nx = e.x + dx, 
                    ny = e.y + dy;
            
                // can move to check goes here!!
                if (Core.Translate.canMoveTo(nx, ny, e)) {
                
                    d = Utils.distance(e.x, e.y, nx, ny);
                    
                    Core.Position.update(e, nx, ny);    
                
                }
            
                return d; 
            
            },
            
            // change an elements position by using its target
            byTarget: function(e) {
            
                // speed = 1 means 1px/ms
                var speed = e.c.speed * Core.dt / 10, 
                    distanceTravelled = Core.Translate.by(e, e.target.dx * speed, e.target.dy * speed);
                
                if (distanceTravelled) {
                
                    // we don't travel infinitely
                    if (!e.target.infinitely) {
                    
                        // let's subtract the distance travelled this frame from 
                        // the total distance left 
                        e.target.distance -= distanceTravelled;
                        
                        // we have reached our target
                        if (e.target.distance <= 0) {
                        
                            Core.Translate.stop(e);
                        
                        }
                    
                    }
                
                } else {
                
                    Core.Translate.stop(e);
                
                }            
            
            }, 
            
            // create a target object based on the destination
            createTarget: function(x, y, tx, ty, infinitely) {
            
                var d = Utils.distance(x, y, tx, ty);
            
                return {
                    x: tx, 
                    y: ty, 
                    dx: (tx - x) / d, 
                    dy: (ty - y) / d, 
                    distance: d, 
                    tsStart: +new Date(), 
                    infinitely: infinitely || false, 
                    next: null            
                }
            
            },  
            
            // tell the element to move to a destination 
            to: function(e, x, y, infinitely) {
            
                // set a target
                e.target = Core.Translate.createTarget(e.x, e.y, x, y, infinitely);
    
                // set the elements rotation
                e.rotation = Utils.direction(e.x, e.y, x, y);
            
            },
            
            // stop the element from moving
            stop: function(e, full) {
            
                if (!full && e.target && e.target.next) {
                
                    e.target = e.target.next;
                
                } else {
            
                    e.target = null;
                
                }
            
            }, 
            
            // update all attributes of the element relevant to movement
            update: function(e) {
            
                e.box[0] = e.x - e.width_h;
                e.box[1] = e.y - e.height;
                e.box[2] = e.x + e.width_h;
                e.box[3] = e.y;
                
                e.hitBox[0] = e.box[0] + Core.Settings.assets[e.assetId].hitboxOffset[0];
                e.hitBox[1] = e.box[1] + Core.Settings.assets[e.assetId].hitboxOffset[1];
                e.hitBox[2] = e.box[2] - Core.Settings.assets[e.assetId].hitboxOffset[2];
                e.hitBox[3] = e.box[3] - Core.Settings.assets[e.assetId].hitboxOffset[3];
            
            }
        
        }, 
        
    //// C O M B A T    S E C T I O N //////////////////////////////////////////////
    
        Combat: {
        
            damage: function(e, skill, target) {
            
                // 1 get the base damage (random value between total minimum 
                // and total maximum damage)
                // creatures only have one damge attribute
                var dmg = Utils.random(e.c.minDmg, e.c.maxDmg);
                
                // 2 apply skill damage bonus
                dmg *= skill[2].dmgx;

                // 3 apply target modifiers
                if (target.is(F.ELITE)) {
                
                    dmg *= (e.c.dmgAgainstElites || 1);
                
                }
                
                if (Utils.is(skill, F.MELEE)) {
                
                    dmg *= (e.c.dmgAgainstMelee || 1);
                
                } else if (Utils.is(skill, F.RANGED)) {
                
                    dmg *= (e.c.dmgAgainstRanged || 1);
                
                }
                
                // 4 apply elemental damage bonus
                if (Utils.is(skill, F.FIRE)) {
                
                    dmg *= (e.c.increasedFireDmg || 1);
                
                } else if (Utils.is(skill, F.COLD)) {
                
                    dmg *= (e.c.increasedColdDmg || 1);       
                
                } else if (Utils.is(skill, F.LIGHTNING)) {
                
                    dmg *= (e.c.increasedLightningDmg || 1);  
                
                }
                
                // MASTERY BONUS
                // STRENGTH BONUS
                // PASSIVE DAMAGE BONUS
                // BUFFS/DEBUFFS
                
                return dmg;
            
            },
            
            damageReduction: function(e, skill, source) {
            
                var dr = 0;
            
                // 1 we check if we are immune
                if (e.is(F.IMMUNE)) {
                
                    dr += 1;    
                
                } else {
                
                    // 2 we check if there is a shield  
                    if (Math.random() <= (e.c.blockChance || 0)) {
                    
                        dr += (e.c.block || 0);
                    
                    } 
                    
                    // 3 we check our resistances
                    _.each(['FIRE', 'COLD', 'LIGHTNING', 'POISON', 'PHYSICAL'], function(i) {
                    
                        if (Utils.is(skill, F[i])) {
                        
                            dr += (e.c[i.toLowerCase() + 'Res'] || 0);
                        
                        }
                    
                    });
                    
                    // 4 we check our damage reduction against the attacker
                    if (Utils.is(skill, F.MELEE)) {
                
                        dr += e.c.resAgainstMelee || 0;
                    
                    } else if (Utils.is(skill, F.RANGED)) {
                    
                        dr += e.c.resAgainstRanged || 0;
                    
                    } 
                    
                    // 5 reduce the damage further by the armor of the target
                    //dr += Core.Utils.attr(target, 'armor') * target.life / 100;
                    
                    
                }

                return Math.min(1, dr);
            
            },  
        
            hit: function(source, target, skill) {
            
                var res = [0, []];

                // 1 check if the target dodges the attack
                if (Math.random() <= (target.c.dodgeChance || 0)) {
                
                    res[1].push(F.DODGED);        
                
                } else {
                
                    // 2 calculate the damage
                    // 2.1 check for crushing blow
                    //     a crushing blow deals damage in the value of one 
                    //     quarter of the targets total hitpoints
                    if (Math.random() <= (source.c.crushingBlowChance || 0)) {
                    
                        res[0] = target.life * 0.25;
                        res[1].push(F.CRUSHINGBLOW);
                    
                    } else {
                    
                        // 2.2 calculate the damage based on the source 
                        // attributes and the skill used
                        // any (de)buffs are also included in the calculation
                        // the type of target is also included
                        res[0] = this.damage(source, skill, target);
                        
                        // 2.3 check if this is a critical hit
                        //     critical hits damage is increased by the 
                        //     sources critical hit damage
                        if (Math.random() <= (source.c.critChance || 0)) {
                        
                            res[0] *= (source.c.critDmg || 1);
                            res[1].push(F.CRITICAL)
                        
                        }
                    
                    }

                    // 3 reduce the damage by armor/res/shield of the target
                    res[0] -= res[0] * (this.damageReduction(target, skill, source)) / 1; 
                    
                    // 4 apply the final damage to the target and check if the 
                    // target survived
                    target.c.life = Math.max(0, target.c.life - Math.max(0, res[0]));
                    
                    if (target.c.life == 0) {
                    
                        target.flags.push(F.DEAD);
                        res[1].push(F.LETHAL);
                    
                    }            
                                        
                
                } 
                
                return res;               
            
            }
        
        }, 
        
    //// U T I L I T Y    S E C T I O N ////////////////////////////////////////////    
        
        Utils: {
        
            // check if an item matches all conditions
            // i.e: the item contains all given flags
            // flags array can be the index 1 of a provided array or the 
            // 'flags' attribute of a provided object
            is: function(e, condition1) {

                return arguments.length - 1 == _.intersection((arguments[0].flags || arguments[0][1]), [].slice.call(arguments, 1)).length;
            
            }, 
            
            // compare two entities
            equals: function(e1, e2) {
            
                return Utils.is.apply(this, [e1].concat(e2.flags || e2[1]));
            
            }, 
            
            // get a blueprint for a set of flags
            blueprint: function(flags) {
            
                var bp;

                _.each(Core.Settings.blueprints, function(blueprint) {

                    if (_.intersection(flags, blueprint[4]).length == blueprint[4].length) {
                    
                        bp = blueprint;
                        return;    
                    
                    }
                
                });    
                
                return bp;
            
            },
            
            // get a blueprint by one distinctive flag
            blueprintBySingleFlag: function(flag) {
            
                var bp;
                
                _.each(Core.Settings.blueprints, function(blueprint) {
                
                    if (blueprint[4].indexOf(flag) != -1) {
                    
                        bp = blueprint;
                        return;
                    
                    }
                
                });
                
                return bp;
            
            }, 
            
            // get a creature blueprint by one distinctive flag
            creatureBlueprint: function(flag) {
            
                var bp;
                
                _.each(Core.Settings.creatures, function(blueprint) {
                
                    if (blueprint[1].indexOf(flag) != -1) {
                    
                        bp = blueprint;
                        return;
                    
                    }
                
                });
                
                return bp;
            
            }, 
            
            // returns the itemType based on a blueprint
            itemTypeByBlueprint: function(blueprint) {

                return _.find([F.WEAPON, F.ARMOR, F.JEWELRY, F.MATERIAL, F.ORNAMENT, F.UTILITY, F.QUEST, F.OTHER], function(i) { return blueprint[4].indexOf(i) != -1; });
            
            }, 
            
            // return the maxmimum amount of sockets a given item can have
            maxSockets: function(item) {
            
                return ((((this.blueprint(item[1]) || [])[7] || {}).sockets || [])[1] || 0);   
            
            }, 

            // returns the name of an item/creature based on the flags
            // flags are alway the first element, the name is the first 
            // element in the blueprint
            name: function(e) {
            
                return e[2].name || this.blueprint(e[1])[0];

            }, 
            
            // displayName
            displayName: function(e) {
            
                return this.name(e);   
            
            }, 
        
            // calculate the distance between two positions in pixels
            distance: function(x, y, x2, y2) {
            
                return Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));  
            
            }, 
            
            // calculate the angle between the given vector and the x-axis
            direction: function(x, y, x2, y2) {
            
                var theta = Math.atan2((y2 - y) * -1, x2 - x);
                
                if (theta < 0) {
                
                    theta += 2 * Math.PI;
                
                }
                
                return theta;
            
            }, 
            
            // random value between min and max
            random: function(min, max) {

                return Math.random() * (max - min) + min;
            
            }, 
            
            // return a random int value
            randomInt: function(min, max) {

                if (max == undefined) {

                    return Math.round(this.random(min[0], min[1]));
                
                }

                return Math.round(this.random(min, max));
            
            }, 
            
            // random item from a list of items
            randomA: function(set) {
            
                return set[this.randomInt(0, set.length - 1)];    
            
            }, 
            
            // random item from a set with different probabilities
            // set is a list of arrays where [index] 
            // holds the probability (0 = 0%, 1 = 100%)
            // e.g.: [[123, 0.2, 'abc'], [234, 0.8, 'cdx']]
            // in the example the method would return element 1 in 20% and 
            // element 2 in 80% of the cases
            randomP: function(set, probabilityIndex) {
            
                // get a random number and initialize v as 0
                var r = Math.random(),
                    v = 0, i; 
                
                // we loop through the set and add up the probability each 
                // iteration. if the probability is larger than the random 
                // number we've found our element  
                // if all propabilities add up to 1 this should return 
                // individual elements correctly
                for (i = 0; i < set.length; i++) {
                
                    v += set[i][probabilityIndex];
                
                    if (r <= v) {

                        return set[i];
                    
                    }    
                
                }
            
                return null;       
            
            }, 
            
            // random item from a set with different probabilities
            // in this case the probabilities are relative
            // i.e. grab all higher than the random number and 
            // randomy choose one of the resulting
            randomP2: function(set, probabilityIndex) {
            
                // get a random number
                var r = Math.random(),
                // filter the set for all items with a higher probability 
                // than the choosen random value 
                    set = _.filter(set, function(i) { return i[probabilityIndex] >= r; });
                
                if (set.length > 0) {
                
                    // return a random item from the set
                    return this.randomA(set);
                
                }
                
                return null;            
            
            }, 
            
            // random item from a list filtered first by min/max level check
            randomL: function(set, level, probabilityIndex, minLevelIndex, maxLevelIndex) {

                return this.randomP2(_.filter(set, function(i) {
                
                    return level >= i[minLevelIndex] && level <= i[maxLevelIndex];
                
                }), probabilityIndex);
            
            }, 
            
            // random item from a list filtered by min/max level check and 
            // flags
            randomL2: function(set, level, flags, probabilityIndex, minLevelIndex, maxLevelIndex, flagIndex) {
            
                return this.randomL(_.filter(set, function(i) {
                
                    return _.intersection(i[flagIndex], flags).length > 0;
                
                }), level, probabilityIndex, minLevelIndex, maxLevelIndex);
            
            }, 
            
            // returns an empty grid of given dimensions
            createGrid: function(rows, cols) {
        
                var grid = [], 
                    i, j;
              
                for (i = 0; i < rows; i++) {
                
                    grid.push([]);
                    
                    for (j = 0; j < cols; j++) {
                    
                        grid[i].push(0);
                    
                    }
                
                }
                
                return grid;

            }, 
            
            slotOptions: function(item) {
            
                var a = [
                        [F.WEAPON, [F.WEAPON1, F.WEAPON2]], 
                        [F.TOKEN, [F.TOKEN1, F.TOKEN2, F.TOKEN3]], 
                        [F.RING, [F.RING1, F.RING2]],
                        [F.OFFHAND, [F.OFFHAND1, F.OFFHAND2]],  
                        [F.AMULET], 
                        [F.HEADPIECE], 
                        [F.CHESTARMOR], 
                        [F.BOOTS], 
                        [F.GLOVES], 
                        [F.PANTS], 
                        [F.BRACERS], 
                        [F.SHOULDERS] 
                    ], 
                    i;
                
                for (i = 0; i < a.length; i++) {
                
                    if (this.is(item, a[i][0])) {
                    
                        return a[i];
                    
                    }
                
                } 
                
                return null;   
            
            }, 
            
            // return the slot for a given item
            // slot hint is used to indicate e.g. weapon2, token3 or ring2
            slot: function(item, slotHint) {
            
                var slotOptions = this.slotOptions(item);
                
                if (slotOptions != null) {
                
                    if (slotOptions.length == 1) {
                    
                        return slotOptions[0];
                    
                    } else {
                    
                        if (slotHint && slotOptions[1].indexOf(slotHint) != -1) {
                        
                            return slotHint;
                        
                        } else {
                        
                            return slotOptions[1][0];
                        
                        }
                    
                    }  
                
                }
                
                return null;
            
            }, 
            
            isSlotValid: function(item, slot) {

                var slotOptions = this.slotOptions(item);

                return slotOptions != null && ((slotOptions.length == 1 && slotOptions[0] == slot) || (slotOptions.length == 2 && slotOptions[1].indexOf(slot) != -1));    
            
            }, 
            
            rank: function(flag) {
            
                return _.find(Core.Settings.itemRanks, function(i) { return i[0] == flag; });
            
            }, 
            
            quality: function(flag) {
            
                return _.find(Core.Settings.itemQualities, function(i) { return i[0] == flag; });            
            
            }, 
            
            // returns which of the passed flags is set by the passed element
            isWhichOf: function(e, flags) {
            
                return _.find(flags, function(i) { return Utils.is(e, i); });
            
            }, 
            
            // returns the rank of an item
            itemRank: function(item) {
                
                return _.find(Core.Settings.itemRanks, function(i) { return Utils.is(item, i[0]); }) || [F.NORMAL, 1, 1, 100, null, ""];
            
            }, 
            
            // returns a modifier from an ornament based on the parent item
            ornamentModifier: function(ornament, item) {
                        
                if (Utils.is(item, F.WEAPON)) {
                
                    return ornament[2].weapon;
                
                } else if (Utils.is(item, F.HEADPIECE)) {
                
                    return ornament[2].headpiece;
                
                } else if (Utils.is(item, F.ARMOR)) {
                
                    return ornament[2].armor;
                                                
                } else if (Utils.is(item, F.JEWELRY)) {
                
                    return ornament[2].jewelry;
                                    
                }
                
                return null;
            
            }, 
            
            // return the first item the player has stored in a given location
            // optionally details can be provided to indicate e.g. an equipment 
            // slot
            itemByLocation: function(player, location, detail) {
            
                return _.find(player.items, function(i) { 
                
                    return i[4][0] == location && (detail ? i[4][1] == detail : true);
                
                });
            
            },
            
            // return all items the player has stored in a given location
            // optionally details can be provided to indicate e.g. an equipment 
            // slot
            itemsByLocation: function(player, location, detail) {
            
                return _.filter(player.items, function(i) {
                            
                    return i[4][0] == location && (detail ? i[4][1] == detail : true);    
                
                });
            
            },
            
            rectHitTest: function(r1, r2) {

                return !(r1[0] < r2[0] + r2[2] || r1[0] + r1[2] > r2[0] || r1[1] < r2[1] + r2[3] || r1[1] + r1[3] > r2[1]);  
            
            }

        }
    
    }
    
    var Utils = Core.Utils;
    var F = Core.Flags;
    
    if (typeof module !== 'undefined') {
    
        Core.Settings = require('./../../store/settings.json');
        Core.init();
    
        module.exports = Core;
    
    } else {
        
        $.getJSON('store/settings.json', {}, function(d) {
        
            window.Core.Settings = d;
            window.Core.init();    
        
        });
        
        window.Core = Core;
    
    }

}).call(this);
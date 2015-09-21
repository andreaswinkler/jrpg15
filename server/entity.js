"use strict";

module.exports = function(_, Core, F, Blueprints, Item) {

    return {
    
        createCharacter: function(character) {

            character.life = character.vit * 10;
            character.mana = character.int * 5;
            character.magicFind = 1;
            character.goldFind = 1;
            character._c = {
                life: character.life, 
                mana: character.mana, 
                speed: character.speed, 
                magicFind: character.magicFind, 
                goldFind: character.goldFind
            };
            character.width = 50;
            character.height = 50;
            character._halfWidth = character.width / 2;
            character.attackSpeed = 1;
            character.dmg = 1.5;
            character.skills = [{
                type: F.MELEE,  
                cooldown: 0, 
                dmgMultiplier: 1, 
                dmgType: F.PHYSICAL, 
                // wait/animate 200ms before attacking (divide by attackSpeed)
                msPreAnimation: 200, 
                // wait/animate 200ms after attacking (divide by attackSpeed)
                // then apply cooldown
                msPostAnimation: 200, 
                // the cost of the skill
                manaCost: 0, 
                // the range of our skill
                range: 75, 
                name: 'Bash'
                
            }];
            
            character.level = 1;
            
            character._inputs = [];
            
            return character;
        
        },
        
        /* HITTESTTARGETS
        *
        */
        hitTestTargets: function(entity, targets) {
        
            var hit = Core.hitTest(entity, targets);
            
            if (hit) {
            
                this.applyDamage(entity, hit);
                
                this.change(entity, 'isDead', true);
            
            }
        
        },
        
        applyDamage: function(source, target) {
 
            var dmg = source._source ? source._source.dmg : source.dmg;
            
            if (source.dmgMultiplier) {
            
                dmg *= source.dmgMultiplier;
            
            }
 
            this.changeLife(target, dmg * -1);
            
            if (target.fleeOnHit) {
            
                this.flee(target, source._source ? source._source : source);    
            
            }
        
        },          
        
        /* FLEE
        *  some creatures flee due to various reasons
        *  basically we try to find a position somewhere to the opposite
        *  direction of our attacker                        
        */        
        flee: function(entity, attacker) {
        
            var v = Core.unitVector(entity, attacker), 
                x = entity.x + (500 * v[0]), 
                y = entity.y + (500 * v[1]);
        
            this.moveTo(entity, x, y);        
        
        }, 
        
        /* CREATECREATURE
        *  create a sophisticated evil critter
        */  
        createCreature: function(creature) {
            
            // adjust life/dmg cubical by level
            creature.life *= Math.pow(creature.level, 3);
            creature.dmg *= Math.pow(creature.level, 3);
            
            creature._c = {
                life: creature.life, 
                speed: creature.speed
            };
            
            return creature;
        
        },       
        
        /* CREATELOOTABLE
        *  create a simple chest
        */        
        createLootable: function(lootable) {
        
            return lootable;       
        
        }, 
        
        /* CREATEPROJECTILE
        *
        */
        createProjectile: function(skill, source, x, y, tx, ty, map, targets) {
        
            var projectile = Core.clone(skill);
            
            projectile._id = Core.id();
            projectile._halfWidth = projectile.width / 2;
            projectile._targets = targets;
            projectile.isFlying = true;
            projectile._c = {
                speed: projectile.speed
            };
            
            Core.setPosition(projectile, x, y, map);
            
            // bind to map
            projectile._map = map;
            
            // bind to source
            projectile._source = source;
            
            this.moveTo(projectile, tx, ty, projectile.range);
            
            // send 'create' update
            _.each(['assetId', 'x', 'y', 'z', 'speed', '_c', 'width', 'height', '_halfWidth', 'isFlying'], function(e) {
                
                this.change(projectile, e, projectile[e]);    
                
            }, this);
            
            return projectile;  
        
        },         
        
        /* CREATE
        *  create a chest or critter or something
        */         
        create: function(type, rank, x, y, map) {
        
            var blueprint = Blueprints[type], 
                entity = Core.clone(blueprint);
            
            entity._id = Core.id();
            entity.level = map.level;
            entity._halfWidth = entity.width / 2;
            
            switch (blueprint.entityType) {
            
                case F.CREATURE:
                
                    entity = this.createCreature(entity);
                    
                    break;
                
                case F.LOOTABLE:
                
                    entity = this.createLootable(entity);
                    
                    break;    
            
            }
        
            // position and hit box
            Core.setPosition(entity, x, y, map);

            // bind to map
            entity._map = map;
            
            // send 'create' update
            _.each(['type', 'rank', 'x', 'y', 'z', 'rot', 'speed', '_c', 'width', 'height', 'entityType', '_halfWidth'], function(e) {
                
                this.change(entity, e, entity[e]);    
                
            }, this);
            
            return entity;       
        
        },        
        
        /* MOVETO
        *  tell the entity to move towards a target
        */        
        moveTo: function(entity, x, y, range) {
    
            this.change(entity, 'target', Core.createTarget(entity.x, entity.y, x, y, range));
        
        },
        
        /* MOVE
        *  this is called if the entity has a target
        *  move the entity by the target settings        
        */        
        move: function(entity, seconds, map) {        
        
            // try to move towards the target
            // if this is not possible for some reason (e.g. obstacle) 
            // the method returns false and we stop
            if (!Core.moveByTarget(entity, entity.target, seconds, map)) {
            
                this.stop(entity);
            
            } 
        
        }, 
      
        /* UPDATEPOSITION
        *  makes sure the current entities position is sent to the client 
        *  as an update        
        */
        updatePosition: function(entity) {
        
            this.change(entity, 'x', entity.x);
            this.change(entity, 'y', entity.y);
            this.change(entity, 'z', entity.z);
            this.change(entity, 'rot', entity.rot);
        
        },
        
        /* STOP
        *  stop the entity by setting the target to null
        */        
        stop: function(entity) {
        
            this.change(entity, 'target', null);
            this.updatePosition(entity);   
        
        },  
        
        /* CHOOSESKILL
        *  
        */
        chooseSkill: function(entity, distance) {

            return _.find(entity.skills, function(skill) {

                return !skill._cooldown && skill.range >= distance;
            
            }) || null;
        
        },
        
        /* AGGRO
        *  check if any enemy is in aggro range and if so engage
        */        
        aggro: function(entity, map, ticks) {

            var distance, skill;

            if (entity._aggroTarget) {
            
                entity._aggroTimeout -= ticks;
                
                // get the distance between us and our enemy
                distance = Core.distance(entity.x, entity.y, entity._aggroTarget.x, entity._aggroTarget.y);
                
                // let's try to find a skill based on the distance to the 
                // aggro target
                skill = this.chooseSkill(entity, distance);
            
                if (skill) {
                
                    this.skill(entity, skill, entity._aggroTarget, map, map.heroes);   
                
                } else if (entity._aggroTimeout < 0 || distance > entity.aggroRange * 2) {
                
                    entity._aggroTarget = null;
                    
                    this.stop(entity);
                
                } 
            
            } else {
        
                entity._aggroTarget = Core.getFirstInRange(entity, map.heroes, entity.aggroRange);
                
                if (entity._aggroTarget) {
                    
                    // we don't update our aggro target every frame, just 
                    // wait a bit
                    entity._aggroTimeout = 5000;
                    
                    this.moveTo(entity, entity._aggroTarget.x, entity._aggroTarget.y);
                
                } 
           
            }   
        
        }, 
        
        /* ADDLIFE
        *  Change the current life of an entity by a specific amount
        *  The method makes sure the upper (total life) and lower (0) 
        *  boundaries are respected                
        */        
        changeLife: function(entity, life) {
            
            this.change(entity, '_c.life', Math.max(0, Math.min(entity._c.life + life, entity.life)));
            
            if (entity._c.life == 0) {
            
                this.change(entity, 'isDead', true);
            
            }
        
        }, 
        
        /* CHANGE
        *  register a change on an entity to the corresponding map object
        */        
        change: function(entity, key, value) {
        
            Core.deepUpdateProperty(entity, key, value);
        
            if (!entity._map.updates) {
            
                entity._map.updates = {};
            
            }
        
            if (!entity._map.updates[entity._id]) {
            
                entity._map.updates[entity._id] = {};
            
            }
        
            entity._map.updates[entity._id][key] = value;
        
        }, 
        
        skill: function(entity, skill, target, map, targets) {
        
            if (!skill._cooldown) {
            
                // do we need to wait a little bit?
                if (skill.msPreAnimation) {
                
                    entity._skill = { skill: skill, target: target, targets: targets, state: F.PREATTACK, delay: skill.msPreAnimation };
                    skill._cooldown = skill.msPreAnimation / 1000;    
                
                } else {
                
                    this.invokeSkill(entity, skill, target, map, targets);
                
                }
      
                // using a skill always stops entities (at least for now :))
                this.stop(entity);    
            
            }
        
        }, 
        
        /* INVOKESKILL
        *  unconditionally invoke a skill, all delays and checks have been 
        *  done already        
        */        
        invokeSkill: function(entity, skill, target, map, targets) {
        
            // let's attack the bastard
            if (skill.type == F.RANGED && !target.isDead) {
            
                map.projectiles.push(this.createProjectile(skill, entity, entity.x, entity.y, target.x, target.y, map, targets));    
            
            } else if (skill.type == F.MELEE && !target.isDead) {
            
                this.applyDamage(entity, target);
            
            }
            
            // remember: cooldown is set in seconds
            skill._cooldown = skill.cooldown;

        }, 
        
        deferredSkill: function(entity, ticks, map) {
            
            entity._skill.delay -= ticks;
        
            if (entity._skill.delay <= 0) {
        
                if (entity._skill.state == F.PREATTACK) {
                
                    this.invokeSkill(entity, entity._skill.skill, entity._skill.target, map, entity._skill.targets);  
                    
                    entity._skill.delay = entity.msPostAnimation || 0;
                    entity._skill.state = F.POSTATTACK;   
                
                } else if (entity._skill.state == F.POSTATTACK) {
                
                    entity._skill = null;
                
                }   
            
            }
        
        }, 
        
        /* LOOT
        *  open a lootable
        */        
        loot: function(entity, lootable, map) {
        
            var items = Item.createDrop(lootable, entity._c.magicFind, entity._c.goldFind), 
                // get items.length positions along an Archimedean spiral
                positions = Core.equidistantPositionsOnArchimedeanSpiral(items.length, 30, lootable.x, lootable.y); 
            
            _.each(items, function(item, index) {
            
                this.dropItem(item, map, positions[index].x, positions[index].y);
            
            }, this);         
        
        }, 
        
        /* DROP ITEM
        *  drop an Item to the ground
        */        
        dropItem: function(item, map, x, y) {
        
            var droppedItem = {
                _id: Core.id(), 
                _item: item, 
                _map: map, 
                type: item.type, 
                rank: item.rank, 
                x: x, 
                y: y, 
                z: Core.tile(map, x, y).z, 
                name: item.name, 
                width: 20, 
                height: 20  
            };
        
            map.droppedItems.push(droppedItem);
            
            // send 'create' update
            _.each(['type', 'rank', 'x', 'y', 'z', 'name', 'width', 'height'], function(e) {
                    
                this.change(item e, item[e]);    
                
            }, this); 
        
        }, 
        
        /* INPUTS
        *  handle any player inputs
        */        
        inputs: function(entity, map) {
        
            // Core.resolveInputs expect a handler list for all possible
            // outcomes of the input
            Core.resolveInputs(entity, map, {
                context: this, 
                moveTo: this.moveTo,  
                skill: this.skill, 
                loot: this.loot    
            });
        
        }
    
    }

};               
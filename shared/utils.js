"use strict";

module.exports = function UtilsFactory() {

    return {
    
        // calculate the distance between two sets of cartesean coordinates
        distance: function(x, y, x2, y2) {
    
            return Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));      
    
        },
        
        // get the unit vector between two positions/entities
        unitVector: function(pos1, pos2) {
        
            var d = this.distance(pos1.x, pos1.y, pos2.x, pos2.y);
            
            return [
                pos2.x - pos1.x / d, 
                pos2.y - pos1.y / d
            ];
        },
        
        // extend an object by another one and sum up any matching attributes
        extendAdditive: function(obj, obj2) {
            for (var key in obj2) {
                switch (key) {
                
                    case 'increasedAttackSpeedPercent': 
                        if (obj.attackSpeed) {
                            obj.attackSpeed *= (1 + obj2[key] / 100);    
                        }
                        break;
                    
                    case 'damagePercent':
                        if (obj.minimumDamage) {
                            obj.minimumDamage *= (1 + obj2[key] / 100);
                        }
                        if (obj.maximumDamage) {
                            obj.maximumDamage *= (1 + obj2[key] / 100);
                        }
                        break;
                    
                    default: 
                        if (obj[key]) {
                            obj[key] += obj2[key];
                        } else {
                            obj[key] = obj2[key];
                        }                       
                        break;
                    
                
                }
            }
        }, 
        
        /* may not be necessary */
        extendDeep: function() {
        
            var dest = arguments[0];
        
            for (var i = 1; i < arguments.length; i++) {
            
                for (var prop in arguments[i]) {
                
                    if (prop in dest) {
                    
                        this.extendDeep(dest[prop], arguments[i][prop]);
                    
                    } else {
                    
                        dest[prop] = arguments[i][prop];
                    
                    }   
                
                }        
            
            }
        
            return dest;
        
        }    
    
    };

}
"use strict";

(function(exports){

    // determine slot
    exports.slot = function(item, slotHint) {
    
        return slotHint;
    
    };

    // space 
    exports.createSpace = function(flag, dimensions) {
    
        return {
            f: flag, 
            grid: this.createTwoDimensionalArray(dimensions[0], dimensions[1])
        };  
    
    };
    
    // returns an empty grid (i.e. 2-dimensional array) of given dimensions
    exports.createTwoDimensionalArray = function(rows, cols) {
        
        var a = [], i, j;
        
        for (i = 0; i < rows; i++) {
        
            a.push([]);
            
            for (j = 0; j < cols; j++) {
            
                a[i].push();
            
            }
        
        }
        
        return a;
    
    };

})(typeof exports === 'undefined' ? this['Core'] = {} : exports);
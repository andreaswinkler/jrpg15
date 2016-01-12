var UI = {

// HANDLERS ////////////////////////////////////////////////////////////////////

    mouseMove: function(e, f) {
    
        e.mousemove(function(ev) {
        
            var e = $(ev.target), 
                x = ev.pageX - e.offset().left, 
                y = ev.pageY - e.offset().top;
            
            f.call(this, x, y, e, ev);       
        
        });
    
    }, 
    
    mouseClick: function(e, f) {
    
        e.click(function(ev) {
        
            var e = $(ev.target), 
                x = ev.pageX - e.offset().left, 
                y = ev.pageY - e.offset().top;
            
            f.call(this, x, y, e, ev);       
        
        });
    
    }

}
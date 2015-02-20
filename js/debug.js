var Debug = {

    frames: 0, 
    tsFrameStart: undefined, 
    totalFrameTime: 0,     
    
    frameStart: function() {
    
        Debug.tsFrameStart = +new Date();
    
    }, 
    
    frameEnd: function() {
    
        Debug.totalFrameTime += +new Date() - Debug.tsFrameStart;
        Debug.frames++;    
    
    }, 
    
    avgFrameTime: function() {
    
        return (Debug.totalFrameTime / Debug.frames).toFixed(4) + 'ms';
    
    }

}
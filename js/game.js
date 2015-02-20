var Game = {

    // the current game state
    state: null,
    
    // is the game running?
    running: false, 
    
    // the request animation frame object
    rAF: window.requestAnimationFrame || 
         window.mozRequestAnimationFrame || 
         window.webkitRequestAnimationFrame || 
         window.msRequestAnimationFrame,  
    
    // timestamp of last loop
    tsLastLoop: undefined,
    
    // start is called whenever a game is loaded or a map is changed
    // based on the passed game state we load all necessary data
    start: function(gameState) {
    
        Game.state = gameState;      

        // make sure all elements are prepared
        _.each(Game.state.elements, Core.prepareElement);

        Game.running = false;

    },
    
    // this is used to actually start the game
    run: function(dontRunIfPaused) {
        
        // let's get a current timestamp and calculate the 
        // time since the last loop (in milliseconds)        
        var ts = +new Date(), 
            dt = ts - (Game.tsLastLoop || ts);
    
        // if we don't get passed the parameter (which happens only on the 
        // initial call), we force the game status to 'running'
        if (!dontRunIfPaused) {
        
            Game.running = true;
        
        }
    
        if (Game.running) {
    
            // check if a minimum of 16.6 milliseconds passed since 
            // the last run
            if (dt >= 16.6) {
            
                // here the magic happens:
                // we store the timestamp of the current frame and 
                // calculate the new gamestate
                // then we draw everything to the screen
                Game.tsLastLoop = ts;
        
                Game.update(dt);
                
                Renderer.draw(Game.state);
            
            } 
            // otherwise we do nothing
            else {
            
                if (!Game.tsLastLoop) {
                
                    Game.tsLastLoop = ts;
                
                }
            
            }  
            
            // we tell the browser to call the run method again as soon 
            // as possible (or suitable)
            Game.rAF.call(window, function() { Game.run(true); });  
        
        }
    
    }, 
    
    // this is used to find an element by its id
    find: function(id) {
    
        return _.find(Game.state.elements, function(e) { return e.id == id; });
    
    }, 
    
    // this is used to deal with the events passed in either by user interaction
    // from the UI class or by server commands from the Net class
    handleEvent: function(event, x, y) {
    
        switch (event) {
        
            // left-click
            case 0:
            // right-click
            case 1:
            
                Core.Translate.to(Game.find(1), x, y);
            
                break;
        
        }
    
    }, 
    
    // calculate game state
    // dt: ms since last update call
    update: function(dt) {
    
        Debug.frameStart();
    
        // set the 'ticks'
        Core.dt = dt;
    
        // update each element
        _.each(Game.state.elements, Core.update);

        Debug.frameEnd(); 
    
    }

}
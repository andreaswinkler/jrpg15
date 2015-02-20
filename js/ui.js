// the UI class handles all user interactions with the game as well as 
// the drawing and behavior of all user interface elements
var UI = {

    // the overall game container
    // the whole game will be put into this container
    container: null, 

    // initialize the UI by passing a parent DOM element (e.g. body)
    init: function(container) {
    
        UI.container = container;
        
        // create the three main game screens: lobby, loading and game
        UI.initLobbyScreen();
        UI.initLoadingScreen();
        UI.initGameScreen();
    
    }, 
    
    initLobbyScreen: function() {
    
        var e = UI.initScreen('lobby');

    }, 
    
    // initialize the loading screen by adding the necessary 
    // dom elements
    initLoadingScreen: function() {
    
        var e = UI.initScreen('loading'); 
        
        e.append('<div class="text"></div>');
        e.append(UI.progressBar());   
    
    }, 
    
    // initialize the game screen by creating a container for the 
    // renderer and bind some event handlers to it
    initGameScreen: function() {
    
        var e = UI.initScreen('game'), 
            gameScreen = $('<div id="game_container" class="fullscreen"></div>');
        
        e.append(gameScreen);
        
        Renderer.init(gameScreen);
        
        gameScreen.click(function(ev) {
        
            ev.preventDefault();
        
            return UI.onGameScreenClick(0, ev.pageX, ev.pageY);
        
        }).bind('contextmenu', function(ev) {
        
            ev.preventDefault();
        
            return UI.onGameScreenClick(1, ev.pageX, ev.pageY);
        
        });
    
    },
    
    // handle clicks on the game screen (i.e. clicks on the map)
    onGameScreenClick: function(event, x, y) {
    
        var pos = Renderer.globalize(x, y);
    
        Game.handleEvent(event, pos.x, pos.y);
        
        return false;
    
    },  

    initScreen: function(key) {
    
        var e = $('<div id="screen_' + key + '" class="screen fullscreen"></div>');
        
        UI.container.append(e);
        
        return e;
    
    }, 

    // display a screen, all others are hidden
    screen: function(key) {
    
        UI.container.find('.screen').css('display', 'none').filter('#screen_' + key).css('display', 'block');    
    
    }, 
    
    // return a progress bar element
    progressBar: function() {
    
        return $('<div class="progress-bar"><div class="progress-bar-current"></div><div class="progress-bar-text"></div></div>');
    
    }

}
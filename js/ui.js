// the UI class handles all user interactions with the game as well as 
// the drawing and behavior of all user interface elements
var UI = {

    // the overall game container
    // the whole game will be put into this container
    container: null, 

    // initialize the UI by passing a parent DOM element (e.g. body)
    init: function() {
    
        // create the three main game screens: lobby, loading and game
        UI.initLobbyScreen();
        UI.initLoadingScreen();
        UI.initGameScreen();
    
    }, 
    
    initLobbyScreen: function() {
    
        var e = UI.initScreen('lobby');
       
        UI.initLobbyScreenLoginView(e);
        UI.initLobbyScreenMainView(e);
        
    },
    
    initLobbyScreenLoginView: function(e) {
    
        var view = UI.initView(e, 'login'), 
            dialog = UI.dialog('login', view);
        
        dialog.append('<input type="text" placeholder="username" />');
        dialog.append('<input type="password" placeholder="password" />');
        dialog.append('<input type="submit" value="login" />');
        
        dialog.find('input[type=submit]').click(function(ev) {
        
            UI.screen();
        
            Net.send('login', { playername: $(ev.target).prev().prev().val(), password: $(ev.target).prev().val() }, Lobby.onLogin);
        
        });
    
    },
    
    initLobbyScreenMainView: function(e) {
    
        var view = UI.initView(e, 'main'), 
            dialog = UI.dialog('options', view);
             
        // create game section
        dialog.append('<input type="button" value="create game" class="creategame" />');
        
        dialog.find('.creategame').click(function(ev) {
        
            Net.send('creategame', {}, Lobby.startGame);
        
        });
        
        // public games section
        view.append('<ul class="public-games"></ul>');
        
        Net.send('gamelist', {}, UI.updateGamelist);
    
    },  
    
    updateGamelist: function(list) {
    
        var container = UI.container.find('.public-games');
        
        // empty list
        container.html('');
        
        // list public games
        _.each(list, function(e) {
        
            container.append('<li>' + e.name + ' <input type="button" data-gameId="' + e.id + '" class="joingame" /></li>');    
        
        });
        
        // join game handler    
        container.find('.joingame').click(function(ev) {  
        
            Net.send('joingame', { gameId: $(ev.target).attr('data-gameId') }, Lobby.onJoinGame);
        
        });  
    
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
    
    initView: function(container, key) {
    
        var e = $('<div id="view_' + key + '" class="view fullscreen"></div>');
        
        container.append(e);
        
        return e;
    
    },  

    // display a screen, all others are hidden
    screen: function(key, sub) {
    
        UI.container.find('.screen').removeClass('active').filter('#screen_' + key).addClass('active');
        
        if (sub) {
        
            UI.container.find('.screen.active .view').removeClass('active').filter('#view_' + sub).addClass('active');
        
        }    
    
    }, 
    
    // return a progress bar element
    progressBar: function() {
    
        return $('<div class="progress-bar"><div class="progress-bar-current"></div><div class="progress-bar-text"></div></div>');
    
    }, 
    
    // show a message dialog
    alert: function(msg, okHandler, okParams) {
    
        var dialog = UI.dialog('alert');
        
        dialog.append('<p class="message">' + msg + '</p>');
        dialog.append('<input type="button" value="ok" />');
        
        dialog.find('input[type=button]').click(function(ev) {
        
            $(ev.target).closest('.dialog').remove();
            
            okHandler.apply(this, okParams);
        
        });    
    
    }, 
    
    // create an empty dialog
    dialog: function(key, container) {
    
        var e = $('<div class="dialog ' + key + '"></div>');
        
        (container || UI.container).append(e);
        
        return e;
    
    }

}
// the UI class handles all user interactions with the game as well as 
// the drawing and behavior of all user interface elements
var UI = {

    // the overall game container
    // the whole game will be put into this container
    container: null, 

    // the current mode
    mode: '', 
    
    // the current screen
    currentScreen: null, 

    // the ui controls/elements
    elements: {}, 

    // the mouse position
    mouse: { x: 0, y: 0 }, 

    // initialize the UI by passing a parent DOM element (e.g. body)
    init: function() {
    
        // create the three main game screens: lobby, loading and game
        UI.initLobbyScreen();
        UI.initLoadingScreen();
        UI.initGameScreen();
        
        // bind the key event listener
        UI.initKeyEvents();
    
    }, 
    
    initKeyEvents: function() {
    
        $(document).keydown(function(ev) {
        
            console.log('keydown <' + ev.which + '>');
            
            switch (ev.which) {
            
                // esc
                case 27:
                
                    UI.escMenu();
                
                    break;
            
            }
        
        });
    
    },
    
    update: function() {
    
        //this.updateElement('life', Game.hero.life_c, Game.hero.life); 
        //this.updateElement('mana', Game.hero.mana_c, Game.hero.mana); 
    
    }, 
    
    exists: function(key) {

        return UI.currentScreen.find('.' + key).length > 0;
    
    }, 
    
    escMenu: function() {
    
        if (UI.mode == 'game' && !UI.exists('game-menu')) {
        
            UI.menu('game-menu', [
                ['Leave Game', UI.leaveGame], 
                ['Return to Game', UI.close]
            ], UI.currentScreen);
        
        }
    
    }, 
    
    leaveGame: function() {
    
        Net.send('leavegame', {}, function() {
        
            UI.close('game-menu');
            UI.screen('lobby', 'main');
        
        });
    
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
            dialog = UI.dialog('options', view), 
            gamelist = UI.listWindow('public-games', view, 'Public Games'), 
            buddylist = UI.listWindow('buddies', view, 'Buddies');
             
        // create game section
        dialog.append('<input type="button" value="create game" class="creategame" />');
        
        dialog.find('.creategame').click(function(ev) {
        
            Net.send('creategame', {}, Lobby.startGame);
        
        });
        
        Net.bind('gamelist', UI.updateGamelist);
        Net.bind('buddylist', UI.updateBuddylist);
    
    },  
    
    updateGamelist: function(list) {
    
        var container = UI.container.find('.public-games ul');
        
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
    
    updateBuddylist: function(list) {
    
        var container = UI.container.find('.buddies ul');
        
        // empty list
        container.html('');
        
        _.each(list, function(e) {
        
            if (e.online) {
            
                container.append('<li class="online">' + e.name + (e.gameId ? ' <input type="button" data-gameId="' + e.gameId + '" value="join" class="joingame" /></li>' : '') + '</li>');
            
            } else {
            
                container.append('<li>' + e.name + '</li>');    
            
            }
        
        });
        
        container.find('.joingame').click(function(ev) {
        
            Net.send('joingame', { gameId: $(ev.target).attr('data-gameId') }, Lobby.onJoinGame);
        
        });
    
    },  
    
    initGlobe: function(key) {
    
        return $('<div id="globe_' + key + '" class="globe"><div class="current"></div><span class="value" /></div>');
    
    },
    
    initField: function(key, value, callback, tooltip, amount) {
    
        var e = $('<div id="field_' + key + '" class="field ' + key + (value ? '' : ' locked') + '" data-event="' + key + '"></div>');
        
        if (tooltip) {
        
            e.get(0).tooltip = $('<div class="tooltip">' + tooltip + '</div>');
            
            e.mouseenter(function(ev) {
            
                this.tooltip.appendTo(this);
            
            }).mouseleave(function(ev) {
            
                $(this).find('.tooltip').remove();
            
            });
        
        }
        
        if (amount) {
        
            e.append('<span class="amount"></span>');
        
        }
        
        if (value && callback) {
        
            e.click(callback);
        
        }
        
        return e;
    
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
            gameContainer = $('<div id="game_container" class="fullscreen"></div>'), 
            controlsContainer = $('<div id="game_controls" class="fullscreen"></div>'),
            mainControlsContainer = $('<div id="game_main_controls"></div>'),  
            minimapContainer = $('<div id="game_minimap"></div>');
        
        // append renderer container
        e.append(gameContainer);
        
        // append controls container
        e.append(controlsContainer);
        
        // append minimap
        e.append(minimapContainer);  
        
        controlsContainer.append(mainControlsContainer);              
        
        this.elements.life = UI.initGlobe('life').appendTo(mainControlsContainer);
        this.elements.xp = UI.progressBar('xp').appendTo(mainControlsContainer); 
        this.elements.skill1 = UI.initField('skill2', null, UI.onFieldClick, 'Locked Skill [1]').appendTo(mainControlsContainer);
        this.elements.skill1 = UI.initField('skill3', null, UI.onFieldClick, 'Locked Skill [2]').appendTo(mainControlsContainer);
        this.elements.skill1 = UI.initField('skill4', null, UI.onFieldClick, 'Locked Skill [3]').appendTo(mainControlsContainer);
        this.elements.skill1 = UI.initField('skill5', null, UI.onFieldClick, 'Locked Skill [4]').appendTo(mainControlsContainer);
        this.elements.skill1 = UI.initField('skill0', null, UI.onFieldClick, 'Locked Skill (left click)').appendTo(mainControlsContainer);
        this.elements.skill1 = UI.initField('skill1', null, UI.onFieldClick, 'Locked Skill (right click)').appendTo(mainControlsContainer);
        this.elements.mana = UI.initGlobe('mana').appendTo(mainControlsContainer);
        
        Renderer.init(gameContainer, minimapContainer);
        
        gameContainer.click(function(ev) {
        
            ev.preventDefault();
        
            return UI.onGameScreenClick(0, ev.pageX, ev.pageY);
        
        }).bind('contextmenu', function(ev) {
        
            ev.preventDefault();
        
            return UI.onGameScreenClick(1, ev.pageX, ev.pageY);
        
        }).mousemove(function(ev) {
        
            UI.mouse.x = ev.pageX;
            UI.mouse.y = ev.pageY;
        
        });
    
    },
    
    close: function(ev) {
    
        if (ev.target) {
        
            $(ev.target).closest('.dialog, .window').remove();
        
        } else {
        
            UI.currentScreen.find('.' + ev).remove();
        
        }
    
    }, 
    
    // handle clicks to control fields (e.g. a skill)
    onFieldClick: function(ev) {
    
        // we pass in the current mouse position, maybe the 
        // following action needs it (e.g. target a skill to the 
        // pointed out location
        var pos = Renderer.globalize(UI.mouse.x, UI.mouse.y);
        
        Game.handleEvent($(ev.target).attr('data-event'), pos.x, pos.y);
        
        return false;
    
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
    
        UI.mode = key + (sub ? '-' + sub : '');
        UI.currentScreen = UI.container.find('#screen_' + key);
    
        UI.container.find('.screen').removeClass('active').filter('#screen_' + key).addClass('active');
        
        if (sub) {
        
            UI.container.find('.screen.active .view').removeClass('active').filter('#view_' + sub).addClass('active');
            UI.currentScreen = UI.currentScreen.find('#view_' + sub);
        
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
    
        var e = $('<div class="dialog center ' + key + '"></div>');
        
        (container || UI.container).append(e);
        
        return e;
    
    }, 
    
    // create an empty window, the basic version of all interfaces
    window: function(key, container, title, allowClose) {
    
        var e = $('<div class="window ' + key + '"></div>');
        
        (container || UI.container).append(e);
        
        e.append('<span class="title">' + (title || '') + '</span>');
        
        if (allowClose) {
        
            e.append('<input type="button" class="window-close" value="x" />');
            
            e.find('.window-close').click(function(ev) {
        
                $(ev.target).closest('.window').addClass('hidden');
            
            });
        
        }
        
        e.append('<div class="window-content"></div>');
        
        return e;    
    
    }, 
    
    // create an window containing an empty list
    listWindow: function(key, container, title) {
    
        var e = UI.window(key, container, title);
        
        e.find('.window-content').append('<ul></ul>');
        
        return e;
    
    }, 
    
    // create a menu-window
    menu: function(key, items, container) {
    
        var e = UI.listWindow(key, container), 
            list = e.find('.window-content ul'), 
            eItem;
        
        e.addClass('center');
        
        _.each(items, function(i) {
        
            eItem = $('<li>' + i[0] + '</li>');
            
            eItem.appendTo(list);
            
            eItem.click(i[1]);            
        
        });
        
        return e;
    
    }

}
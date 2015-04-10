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
    
    // a dragged element
    eDragged: null,  

    // the current inventory tile size in pixels
    spaceCellSize: 40,  

    // initialize the UI by passing a parent DOM element (e.g. body)
    init: function() {
    
        // create the three main game screens: lobby, loading and game
        UI.initLobbyScreen();
        UI.initLoadingScreen();
        UI.initGameScreen();
        
        // bind the key event listener
        UI.initKeyEvents();
        
        Net.bind('grab', UI.grab);
        Net.bind('place', UI.place);
        Net.bind('equip', UI.equip);
    
    }, 
    
    resize: function() {
    
        UI.currentScreen.find('.space').each(function(ind, e) {
        
            $(e).css('background-size', UI.spaceCellSize + 'px ' + UI.spaceCellSize + 'px')
                .css('background-image:repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent ' + UI.spaceCellSize + 'px),repeating-linear-gradient(-90deg, #fff, #fff 1px, transparent 1px, transparent ' + UI.spaceCellSize + 'px');
        
        });

    }, 
    
    initKeyEvents: function() {
    
        $(document).keydown(function(ev) {
        
            console.log('keydown <' + ev.which + '>');
            
            switch (ev.which) {
            
                // esc
                case 27:
                
                    UI.escMenu();
                
                    break;
                
                // i
                case 73:
                
                    UI.inventory();
                
                    break;
            
            }
        
        }).mousemove(function(ev) {
        
            var e = $(ev.target);
        
            // store the cursor position for further use
            UI.mouse.x = ev.pageX;
            UI.mouse.y = ev.pageY;

            // we have something in hand, let's update its position with 
            // the current cursor position
            if (UI.eDragged) {

                UI.drag();
                
                // if we hover over a space (e.g. inventory) we assume the 
                // player wants to place the item in hand and we indicate 
                // whether or not the cells corresponding to the cursor 
                // position are available
                if (e.closest('.space').length > 0) {
                    
                    var startPos = UI.spacePosition(e.closest('.space')), 
                        available = UI.spaceCellsAvailable(
                            startPos[0], 
                            startPos[1],
                            UI.eDragged.get(0).item[2].spaceWidth || 1, 
                            UI.eDragged.get(0).item[2].spaceHeight || 1
                        ), 
                        eHilite = e.find('.hilite');
                    
                    if (available) {
                    
                        eHilite.removeClass('occupied');
                    
                    } else {
                    
                        eHilite.addClass('occupied');
                    
                    }
                    
                    UI.setSpacePosition(eHilite, startPos[0], startPos[1]);                    
                
                }
            
            }            

        });
    
    },
    
    spaceCellsAvailable: function(space, row, col, w, h) {
    
        return _.find(Utils.itemsByLocation(Lobby.user, space), function(i) {
        
            return i[4][1][0] >= col && i[4][1][0] <= col + w && i[4][1][1] >= row && i[4][1][1] <= row + h;
        
        }) === undefined;
    
    }, 
    
    update: function() {
    
        $('#globe_life .value').html(Game.hero.c.life);
    
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
    
    inventory: function() {
    
        if (UI.mode == 'game') {
        
            if (!UI.exists('inventory')) {
            
                UI.createInventory();
                UI.createStatDetails();    
            
            } 
            
            UI.currentScreen.find('.inventory, .stat-details').toggleClass('active');            
        
        }
    
    },
    
    createStatDetails: function() {
    
        // TODO: do something
    
    },  
    
    createSpace: function(spaceKey) {
    
        var e = $('<div class="' + spaceKey + ' space" data-spaceKey="' + spaceKey + '"></div>');
        
        // add the click event (place item)
        e.click(function(ev) {
        
            var e, pos;
            
            if (UI.eDragged) {
            
                e = $(this);
                pos = UI.spacePosition(e);

                UI.requestPlace(e.attr('data-spaceKey'), pos[0], pos[1]); 
            
            }
        
        }).mouseenter(function(ev) {
        
            var e = $(ev.target).closest('.space');
            
            if (e.find('.hilite').length == 0) {
            
                e.append('<div class="hilite"></div>');
                
                if (UI.eDragged) {
                
                    UI.resizeHilites();
                
                }
            
            }
        
        }).mouseleave(function(ev) {
        
            $(ev.target).closest('.space').find('.hilite').remove();
        
        });                                        
        
        return e; 
    
    }, 
    
    label: function(key) {
    
        return Core.Settings.labels[key] || key; 
    
    }, 
    
    createInventory: function() {
    
        var e = UI.window('inventory', UI.currentScreen, 'Inventory'), 
            content = e.find('.window-content'),  
            stats = $('<div class="stats"></div>'), 
            inventory = UI.createSpace('inventory'), 
            equipment = $('<div class="equipment"></div>');
        
        // add the stat elements
        _.each(['str', 'vit', 'int', 'dex', 'armor', 'toughness', 'dps', 'healing', 'gold'], function(stat) {
        
            stats.append('<div class="stat" data-stat="' + stat + '"><label>' + UI.label('stat_' + stat) + '</label><span class="value"></span></div>');
        
        });
        
        content.append(stats);
        
        // add the equipment slots
        _.each(['headpiece', 'chestarmor', 'amulet', 'ring1', 'ring2', 'shoulders', 'bracers', 'gloves', 'belt', 'pants', 'boots', 'token1', 'token2', 'token3', 'offhand1', 'offhand2', 'weapon1', 'weapon2'], function(slot) {
        
            var e = $('<div class="slot ' + slot + '" data-slot="' + slot + '"></div>');
            
            e.click(function(ev) {
            
                var e = $(ev.target).closest('.slot');
            
                if (UI.eDragged) {
                
                    Net.send('cmd', ['equip', parseInt(UI.eDragged.attr('data-id')), e.attr('data-slot')]);
                
                }
            
            });
            
            equipment.append(e);
        
        });
        
        content.append(equipment);

        // add the inventory itself
        content.append(inventory); 
        
        // append the inventory to the current screen
        UI.currentScreen.append(e); 
        
        // add all equipment items
        _.each(Game.hero.equipment, function(item) {

            UI.placeItemInSlot(UI.item(item), K[item[4][1]].toLowerCase());  
        
        });  
        
        // add all inventory items
        _.each(Utils.itemsByLocation(Lobby.user, F.INVENTORY), function(item) {

            UI.placeItemInInventory(UI.item(item), item[4][1]);
        
        });
        
        UI.updateStats();
    
    },  
    
    // update all stats (and details) with the current hero values
    updateStats: function() {
    
        UI.currentScreen.find('.inventory .stats .stat').each(function(ind, e) {
        
            var e = $(e);
            
            e.find('.value').html(Game.hero.c[e.attr('data-stat')]);
        
        });    
    
    }, 
    
    spacePosition: function(space) {
    
        var offset = space.offset();

        return [~~((UI.mouse.y - offset.top) / UI.spaceCellSize), ~~((UI.mouse.x - offset.left) / UI.spaceCellSize)];
    
    }, 
    
    requestGrab: function requestGrab(ev) {
    
        Net.send('cmd', ['grab', parseInt($(ev.target).closest('.item').attr('data-id'))]);
    
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    
    }, 
    
    requestEquip: function requestEquip(ev) {
    
        Net.send('cmd', ['equip', parseInt($(ev.target).closest('.item').attr('data-id'))]);
        
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    
    },
    
    requestUnequip: function requestUnequip(ev) {
    
        Net.send('cmd', ['unequip', parseInt($(ev.target).closest('.item').attr('data-id'))]);
        
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    
    }, 
    
    requestPlace: function(spaceKey, row, col) {
    
        Net.send('cmd', ['place', spaceKey, row, col]);  
    
    },  
    
    setSpacePosition: function(e, row, col) {
    
        e.css('left', (col * UI.spaceCellSize) + 'px').css('top', (row * UI.spaceCellSize) + 'px');
    
    }, 
    
    setSpaceDimensions: function(e, item) {
    
        e.width((item[2].spaceWidth || 1) * UI.spaceCellSize).height((item[2].spaceHeight || 1) * UI.spaceCellSize);    
    
    }, 
    
    setMouseActions: function(e, leftClick, rightClick) {
    
        var tooltipActions = e.get(0).tooltip.find('.actions');
    
        // first we unbind existing click/right-click events
        e.unbind('click').unbind('contextmenu');
        
        // secondly we remove the corresponding tooltip information
        tooltipActions.html('');
        
        if (leftClick) {
        
            e.click(leftClick);
            tooltipActions.html('<span>LEFT: ' + UI.label(leftClick.name) + '</span>');            
        
        }
        
        if (rightClick) {
        
            e.bind('contextmenu', rightClick);
            tooltipActions.append('<span>RIGHT: ' + UI.label(rightClick.name) + '</span>');    
        
        }
        
        return e;
    
    }, 
    
    addToSpace: function(space, eItem, pos) {
    
        UI.setSpacePosition(eItem, pos[1], pos[0]);
        UI.setSpaceDimensions(eItem, eItem.get(0).item);
        
        UI.currentScreen.find('.window .space.' + space).append(eItem);        
    
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
        
            UI.enableTooltip(e, $('<div class="tooltip">' + tooltip + '</div>'));
        
        }
        
        if (amount) {
        
            e.append('<span class="amount"></span>');
        
        }
        
        if (value && callback) {
        
            e.click(callback);
        
        }
        
        return e;
    
    },  
    
    enableTooltip: function(e, tooltip) {
    
        e.get(0).tooltip = tooltip;
        
        e.mouseenter(function(ev) {
        
            this.tooltip.appendTo(this);
        
        }).mouseleave(function(ev) {
            
            $(this).find('.tooltip').remove();
        
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
    
    }, 
    
    // returns the type of an item
    itemType: function(item) {

        return Utils.itemRank(item)[5] + Utils.blueprint(item[1])[0];
    
    }, 
    
    // returns the slot of an item
    itemSlot: function(item) {
    
        if (Utils.is(item, F.ONEHAND)) {
        
            return '1-hand';
        
        } 
        
        return '';   
    
    }, 
    
    // formats an affix to be readable
    affix: function(affix) {
    
        var affixList = affix.length == 1 ? [affix] : affix, 
            s = '';
        
        _.each(affixList, function(i) {
        
            s += UI.label(i[0]).replace('#', i[1]).replace(/\{(.*)\}/, '<small class="white">$1</small>');
        
        });
        
        return s;                                     
    
    }, 
    
    // reposition a grabbed element (e.g. item) 
    // based on the mouse cursor
    drag: function() {

        UI.eDragged.css('left', (UI.mouse.x + 10) + 'px');
        UI.eDragged.css('top', (UI.mouse.y + 10) + 'px');    
    
    }, 
    
    // grab an item (put from a space to the hand)
    grab: function(itemId) {
    
        UI.currentScreen.addClass('dragging');
    
        UI.eDragged = UI.currentScreen.find('.item[data-id="' + itemId + '"]');
        
        UI.eDragged.detach().appendTo(UI.currentScreen).unbind('click').unbind('contextmenu');
        
        UI.resizeHilites();
        
        UI.drag();
    
    },
    
    endDragging: function() {
    
        UI.eDragged.css('top', '0').css('left', '0');
        UI.eDragged = null;
        UI.currentScreen.removeClass('dragging');        
    
    }, 
    
    place: function(params) {

        if (UI.eDragged) {
      
            UI.placeItemInInventory(UI.eDragged.detach(), [params[2], params[1]]);
      
            UI.endDragging();
        
        } else {
        
            console.warn('<place> cmd received when no item in hand.');
        
        }
    
    },  
    
    placeItemInInventory: function(eItem, pos) {
    
        UI.setMouseActions(eItem, UI.requestGrab, UI.requestEquip);
    
        UI.addToSpace('inventory', eItem, pos);
    
    }, 
    
    placeItemInSlot: function(eItem, slot) {
    
        UI.setMouseActions(eItem, UI.requestGrab, UI.requestUnequip);

        UI.currentScreen.find('.window .equipment .slot[data-slot="' + slot + '"]').append(eItem);
    
    }, 
    
    equip: function(params) {

        if (UI.eDragged) {

            UI.placeItemInSlot(UI.eDragged.detach(), params[1]);
        
            UI.endDragging();    
        
        } else {
        
            UI.grab(params[0]);
            UI.equip(params);
        
        }
    
    }, 
    
    resizeHilites: function() {
    
        UI.currentScreen.find('.hilite').each(function(ind, e) {
        
            UI.setSpaceDimensions($(e), UI.eDragged.get(0).item);
        
        });
            
    
    }, 
    
    // create an item element
    // the item element exists from pickup until the item is dropped to the 
    // floor or gets destroyed
    item: function(item) {
    
        var e = $('<div class="item" style="' + Assets.rankBackground(item) + '" data-id="' + item[0] + '"><div class="item-image" style="' + Assets.background(item[2].asset) + '"></div><div class="item-stack"></div></div>');
        
        if (item[2].sockets) {
        
            e.find('.item-image').append(this.sockets(item[2].sockets));
        
        } 
        
        if (item[2].stack && item[2].stack > 1) {
        
            e.find('.item-stack').html(item[2].stack);
        
        }
        
        e.get(0).item = item;
        
        // add the tooltip
        UI.enableTooltip(e, UI.itemTooltip(UI.container, item));
        
        return e;   
    
    }, 
    
    // create the sockets block for an item
    sockets: function(sockets) {
    
        var s = '<ul class="item-sockets">';
            
        _.each(sockets, function(i) {
        
            if (i) {
            
                s += '<li class="socket">';
                
                s += '<div style="' + Assets.background(i) + '"></div>';
                s += '<span class="affix">' + UI.affix(Utils.ornamentModifier(i, ornament)) + '</span>';
                
                s += '</li>';    
            
            } else {
            
                s += '<li class="socket"></li>';        
            
            }
        
        });
        
        s += '</ul>';
        
        return s;
    
    }, 
    
    // create a tooltip for a given item
    itemTooltip: function(container, item) {
    
        var isEquipped = Utils.is(item, F.EQUIPPED), 
            e = UI.window('tooltip item-tooltip', container, Utils.name(item)), 
            affixes;
        
        e.append('<div class="item-image-container" style="' + Assets.rankBackground(item) + '"><div class="item-image" style="' + Assets.background(item[2].asset) + '"></div></div>');
        
        e.append('<div class="item-type">' + UI.itemType(item) + '</div>');
        
        e.append('<div class="item-slot">' + UI.itemSlot(item) + '</div>');
        
        if (Utils.is(item, F.ARMOR)) {
        
            e.append('<div class="item-mainstat">' + item[2].c.armor + '<small>Armor</small></div>');
        
        } else if (Utils.is(item, F.WEAPON)) {
        
            e.append('<div class="item-mainstat">' + item[2].c.dps.toFixed(1) + '<small>Damage per second</small><br /><small class="white">' + item[2].c.minDmg.toFixed(1) + '</small><small>-</small><small class="white">' + item[2].c.maxDmg.toFixed(1) + '</small><small>Damage</small><br /><small class="white">' + (item[2].c.as).toFixed(2) + '</small><small>Attacks per Second</small></div>');
        
        }
        
        if (item[2].affixes) {
        
            affixes = '<ul class="item-affixes">';
            
            _.each(item[2].affixes, function(i) {
            
                affixes += '<li><span class="affix">' + UI.affix(i) + '</span></li>';
            
            });
            
            affixes += '</ul>';
            
            e.append(affixes);
        
        }
        
        if (item[2].sockets) {
        
            e.append(UI.sockets(item[2].sockets));
        
        }
        
        e.append('<div class="item-level-requirement"><small>Required Level: </small><small class="white">' + item[2].c.levelReq + '</small></div>');
        
        if (item[2].c.durability) {
        
            if (Utils.is(item, F.INDESTRUCTIBLE)) {
            
                e.append('<div class="item-durability indestructible">Indestructible</div>');
            
            } else {
        
                e.append('<div class="item-durability"><small>Durability: </small><small class="white">' + item[2].c.durability + '</small><small>/</small><small>' + item[2].durability + '</small></div>');
            
            }
        
        }
        
        // add a container to display any mouse actions currently bound to 
        // the item
        e.append('<div class="actions"></div>');
        
        return e;
    
    }

}
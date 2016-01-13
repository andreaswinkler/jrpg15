var Minimap = function(container, options) {

    this.options = $.extend({
        width: 300, 
        height: 300
    }, options);

    this.container = container;
    this.stage = new RenderLayer(this.options.width, this.options.height);
    
    this.container.append(this.stage.canvas());
    
    this.draw = function(map) {
        
        var tempLayer = new RenderLayer(map.width, map.height);

        _.each(map.grid, function(tile, ind) {
        
            tempLayer.point(tile.c, tile.r, tile.walkable ? 'rgba(255,255,255,1)' : 'rgba(200,200,200,1)');    
        
        });   
        
        this.stage.clear();
        
        this.stage.draw(tempLayer.canvas(), 0, 0, map.width, map.height, 0, 0);
    
    }    

}             

var Editor = {

    map: null,
    
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0,
    
    toolbox: null, 
    stage: null, 
    settings: null, 
    
    currentBrush: null,   

    toolboxConfig: {
        categories: [
            {
                name: 'Ground', 
                brushes: [
                    {
                        name: 'Empty', 
                        sprites: [[147]]
                    }
                ]
            }, 
            {
                name: 'Stairs', 
                brushes: [
                    {
                        name: 'SW', 
                        sprites: [[108], 
                                  [107]]
                    }, 
                    {
                        name: 'SE', 
                        sprites: [[null, 125], 
                                  [123, null]]
                    },
                ]
            }
        ]
    }, 

    init: function(container) {
    
        this.toolbox = $('<div />', { class: 'toolbox' });
        this.stage = $('<div />', { class: 'stage' });
        this.settings = $('<div />', { class: 'settings' });
        this.statusBar = $('<div />', { class: 'status-bar' });
        
        this.stage.width($(window).width() - 600);
        
        this.settings.append($('<div />', { class: 'minimap' }));
        
        this.minimap = new Minimap(this.settings.find('.minimap'));
        
        container.append(this.toolbox);
        container.append(this.stage);
        container.append(this.settings);
        container.append(this.statusBar);

        Renderer.init(this.stage);
        Renderer.mode = 'editor';
        
        UI.mouseMove(this.stage, function(x, y, e, ev) {
        
            // convert to tile position and draw highlight diamond or activated 
            // brush on interaction layer
            var pos = Renderer.convertScreenPositionToTile(x, y);
          
            Editor.statusBar.html(pos.r + ' / ' + pos.c);
          
            Renderer.layers.interaction.clear().draw(Renderer.customTile('hilite', 'rgba(210,0,0,1)'), pos.x, pos.y);

        });
        
        UI.mouseClick(this.stage, function(x, y, e, ev) {
        
            // convert to tile position and draw highlight diamond or activated 
            // brush on interaction layer
            var pos = Renderer.convertScreenPositionToTile(x, y), 
                brush = Editor.currentBrush; 
            
            for (i = 0; i < brush.sprites.length; i++) {
            
                for (j = 0; j < brush.sprites[i].length; j++) {
                
                    if (brush.sprites[i][j] != -1) {
                
                        Editor.map.grid[(pos.r + i) + '_' + (pos.c + j + (i % 2 == 1 && (pos.r + i) % 2 == 1 ? 1 : 0))].spriteIndex = brush.sprites[i][j];
                    
                    }    
                
                }
            
            }
            
            Renderer.map(Editor.map);   
        
        });
        
        Assets.loadMany(['cave-floor']).then(function(assets) {
        
            _.each(Editor.toolboxConfig.categories, function(toolboxCategory) {
                console.log(toolboxCategory);
                var e = $('<div />', { class: 'toolbox-category' });
                
                e.append('<span class="title">' + toolboxCategory.name + '</span>');
                e.append('<div />', { class: 'brushes' });
                
                _.each(toolboxCategory.brushes, function(brush) {
                
                    e.append(Editor.toolboxElementBrush(brush, assets[0]));
                
                });
                
                Editor.toolbox.append(e);
            
            });
        
            Editor.initMap(Editor.create());
        
        });
        
        // setup menu
    
    },
    
    toolboxElementBrush: function(brush, spritesheet) {
    
        var e = $('<div />', { class: 'brush' }), 
            rl = new RenderLayer(100, 50), 
            tileWidth = ~~(100 / ((1 + (brush.sprites[0].length)) / 2)),  
            tileHeight = ~~(tileWidth / 2), 
            i, j, x, y; 
        
        e.get(0)._brush = brush;
        
        for (i = 0; i < brush.sprites.length; i++) {
        
            for (j = 0; j < brush.sprites[i].length; j++) {
                
                if (brush.sprites[i][j] !== null) {
                    
                    x = ~~(i % 2 == 1 ? (j * tileWidth) + tileHeight : (j * tileWidth)), 
                    y = ~~(i * tileHeight / 2);

                    rl.drawSprite(x, y, spritesheet, brush.sprites[i][j], tileWidth, tileHeight);
                                            
                } 
            
            }
        
        }
        
        e.append(rl.canvas());
        e.append('<span class="title">' + brush.name + '</span>');
        
        e.click(function(ev) {
        
            var e = $(ev.target).closest('.brush'), 
                brush = e.get(0)._brush;
            
            e.closest('.toolbox').find('.brush').removeClass('active');
            
            e.addClass('active');
            
            Editor.currentBrush = brush;
        
        });
        
        return e;        
    
    }, 
    
    initMap: function(map) {
    
        this.map = map;
    
        // init minmap
        this.minimap.draw(this.map);
        
        // init renderer
        Renderer.map(this.map);
    
    }, 
    
    // create a new empty map with 
    // default parameters 
    create: function() {
    
        var width = 100, 
            height = 100;
    
        return { 
            name: '',
            theme: 'cave', 
            width: width, 
            height: height, 
            landingPoints: [], 
            spawnTypes: [], 
            spawnPoints: [], 
            grid: this.createGrid(height, width)
        };
    
    }, 
    
    createGrid: function(rows, cols) {
    
        var cells = rows * cols, 
            grid = {}, 
            row = 0, 
            col = 0, 
            i;
        
        for (i = 0; i < cells; i++) {
        
            col = i % cols;
            row = ~~(i / rows);
            
            grid[row + '_' + col] = {
                x: col * Core.TS, 
                y: row * Core.TS, 
                z: 0,
                r: row, 
                c: col,  
                walkable: false, 
                spriteIndex: 0                   
            }
        
        }
        
        return grid;
    
    }, 
    
    // load map 
    load: function(key) {
    
        $.getJSON('../store/maps/' + key + '.json', function(t) {
        
            Editor.map = t;    
        
        });    
    
    }, 
    
    save: function() {
    
        // call server-side save method
    
    }

}
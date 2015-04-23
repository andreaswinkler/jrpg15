// the Renderer draws a given game state to the screen
// it also handles auto-resizing if the containers dimensions change
var Renderer = {

    // the total screen width used for the game
    width: 0, 
    // the total screen height used for the game
    height: 0,
    // width / 2
    halfWidth: 0,
    // height / 2
    halfHeight: 0,
    // the calculated tileWidth based on the screen size
    tileWidth: 0, 
    // the calculated tileHeight based on the screen size
    tileHeight: 0, 
    // tileHeight / 2
    halfTileHeight: 0,
    // the zoom factor to be applied to all assets rendered to
    // the screen at the current size
    zoom: 1,  
    // the standard tile width used to calculate the current 
    // zoom factor [zoom = tileWidth / standardTileWidth]
    standardTileWidth: 64,  
    // the amount of horizontal tiles to be shown regardless 
    // of the screen size
    horizontalTiles: 20, 
    // all render layers
    layers: {}, 
    // the global coordinates of the upper left corner of the 
    // drawn map section
    localRoot: { x: 0, y: 0 }, 
    // the dom element (jquery object) containing the game 
    // screen
    container: null,
    // the dom element (jquery object) holding the minimap
    minimapContainer: null,   

    // initialize the renderer by passing in a jquery object as 
    // parent
    // here all layers are created, appended to the DOM and 
    // adjusted to the container size
    init: function(container, minimapContainer) {
    
        var layer;
    
        Renderer.container = container;
        Renderer.minimapContainer = minimapContainer;
        
        // let's set all our size attributes based on the 
        // given container
        Renderer.resize();
    
        // create and append all render layers
        _.each(['ground'], function(e) {

            layer = new RenderLayer(Renderer.width, Renderer.height);

            Renderer.container.append(layer.e);

            Renderer.layers[e] = layer;
        
        });
        
        // bind our resize method to the window.onResize event
        $(window).resize(Renderer.resize);
    
    }, 
    
    // resize the whole game screen and all its layers and re-calculate
    // all size attributes 
    resize: function() {
        
        // get the current dimenstions from the parent element
        var width = Renderer.container.width(), 
            height = Renderer.container.height();
        
        Renderer.width = width;
        Renderer.height = height;
        Renderer.halfWidth = width / 2;
        Renderer.halfHeight = height / 2;
        
        // calculate the tileWidth by fitting a set amount of tiles 
        // into the available width
        // force the resulting width to be an even number
        Renderer.tileWidth = Math.floor(width / Renderer.horizontalTiles);
        
        if (Renderer.tileWidth % 2) {
        
            Renderer.tileWidth += 1;
        }
        
        Renderer.tileHeight = Renderer.tileWidth / 2;
        Renderer.halfTileHeight = Renderer.tileHeight / 2; 
        
        Renderer.zoom = Renderer.tileWidth / Renderer.standardTileWidth; 
        
        // resize all layers to the new dimenstions
        _.invoke(Renderer.layers, 'resize', width, height);
        
        // force redraw of map
        if (Game && Game.state && Game.state.map) {
        
            Assets.store[Game.state.map.assetId] = null;
        
        }
    
    }, 
    
    // convert a given set of global coordinates (i.e. coordinates in 
    // the game space) to a position on the currently visible 
    // map section 
    // this is done by subtracting from the displayed map sections 
    // root and multiplying with the zoom value
    localize: function(x, y) {
    
        return {
            x: (x - Renderer.localRoot.x) * Renderer.zoom, 
            y: (y - Renderer.localRoot.y) * Renderer.zoom
        };
    
    }, 
    
    // convert a rectangular [x1, y1, x2, y2] with global 
    // coordinates into local ones
    localizeRect: function(rect) {
    
        return [
            (rect[0] - Renderer.localRoot.x) * Renderer.zoom, 
            (rect[1] - Renderer.localRoot.y) * Renderer.zoom, 
            (rect[2] - Renderer.localRoot.x) * Renderer.zoom, 
            (rect[3] - Renderer.localRoot.y) * Renderer.zoom
        ];
    
    }, 
    
    // convert a given set of local coordinates (e.g. the x/y position of 
    // a mouse click) to coordinates in the game space
    globalize: function(x, y) {
    
        return {
            x: x + Renderer.localRoot.x, 
            y: y + Renderer.localRoot.y
        };
    
    },   
    
    // pre-render a given map onto a canvas
    // TODO: this should be done by using a set of canvases to support 
    // for maps exceeding 8000x8000 pixels
    prepareMap: function(map) {
    
        var c = document.createElement('canvas'), 
            ctx = c.getContext('2d');
        
        c.width = map.grid.cols * Renderer.tileWidth + Renderer.tileHeight;
        c.height = map.grid.rows * Renderer.tileHeight;
        
        _.each(map.grid.tiles, function(e, ind) {

            var row = Math.floor(ind / map.grid.cols), 
                col = ind % map.grid.cols;

            ctx.drawImage(
                // load the maps theme sprite sheet
                Assets.get(map.theme),  
                // grab the first sprite from the sheet [0/0]
                0, 
                0, 
                // get the size of the sprite from the meta information 
                Core.Settings.assets[map.theme].spriteDimensions[0],
                Core.Settings.assets[map.theme].spriteDimensions[1], 
                // calculate the horizontal position
                col * Renderer.tileWidth + (row % 2) * Renderer.tileHeight, 
                // calculate the vertical position
                row * Renderer.halfTileHeight + Renderer.halfTileHeight, 
                // use the dimensions based on the screen/container size
                Renderer.tileWidth, 
                Renderer.tileHeight
            );
        
        });
        
        return c;
    
    }, 

    // refresh the screen with the current game state
    draw: function(gameState) {
    
        // clear all layers
        _.invoke(Renderer.layers, 'clear');
        
        // reset the local root based on the current 
        // hero position
        // it's always the hero position minus half the screen 
        // width and height, as long as we don't implement a borderless
        // map rendering
        Renderer.localRoot.x = Math.max(Renderer.tileHeight, Math.min(gameState.map.width - Renderer.width, Lobby.user.hero.x - Renderer.halfWidth));
        Renderer.localRoot.y = Math.max(Renderer.halfTileHeight, Math.min(gameState.map.height - Renderer.height, Lobby.user.hero.y - Renderer.halfHeight));
        
        // draw map
        Renderer.drawMap(gameState.map);

        // draw elements
        _.each(gameState.elements, Renderer.drawElement);
    
    }, 
    
    // draw a single element to the screen
    drawElement: function(element) {
    
        // convert the elements box upper left point to local coordinates
        var localPosition = Renderer.localize(element.box[0], element.box[1]);
    
        // draw box
        Renderer.drawRect('ground', Renderer.localizeRect(element.box), 'rgba(210,0,0,.5)');
        // draw hit box
        Renderer.drawRect('ground', Renderer.localizeRect(element.hitBox), 'rgba(0,210,0,.5)');
    
        // draw the right sprite of the elements asset to the elements 
        // local position
        // the sprite is scaled accoring to the zoom level
        Renderer.drawSection(
            'ground', 
            Assets.get(element),
            0, 
            0, 
            Core.Settings.assets[element.assetId].spriteDimensions[0], 
            Core.Settings.assets[element.assetId].spriteDimensions[1], 
            localPosition.x, 
            localPosition.y, 
            Math.floor(Core.Settings.assets[element.assetId].spriteDimensions[0] * Renderer.zoom), 
            Math.floor(Core.Settings.assets[element.assetId].spriteDimensions[0] * Renderer.zoom) 
        );
    
    }, 
    
    // draw the visible part of the map to the screen
    drawMap: function(map) {

        Renderer.drawSection(
            'ground', 
            Assets.get(map),
            Renderer.localRoot.x, 
            Renderer.localRoot.y,  
            Renderer.width, 
            Renderer.height
        );
    
    },  
    
    // HELPER: draw a section/sprite to the screen
    drawSection: function(layer, src, sx, sy, sw, sh, x, y, w, h) {
       
        var x = x || 0, 
            y = y || 0, 
            w = w || sw, 
            h = h || sh;
       
        Renderer.layers[layer].ctx.drawImage(src, sx, sy, sw, sh, x, y, w, h);
    
    }, 
    
    // HELPER: draw a rectangle to the screen
    drawRect: function(layer, rect, color) {
    
        Renderer.layers[layer].rect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1], color, color);
    
    }

}

// the RenderLayer class represents one canvas and is used to ease the 
// communication with the canvas api 
var RenderLayer = function(width, height) {

    this.width = width;
    this.height = height;
    
    this.e = $('<canvas width="' + this.width + '" height="' + this.height + '"></canvas>');
    this.canvas = this.e.get(0);
    this.ctx = this.canvas.getContext('2d');
    
    // clear the canvas from everything
    this.clear = function() {
    
        this.ctx.clearRect(0, 0, this.width, this.height);
    
        return this;  
    
    };
    
    // resize the canvas to new dimensions
    this.resize = function(width, height) {
    
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    
    };
    
    // draw a rectangle to the canvas
    this.rect = function(x, y, w, h, fs, ss) {
    
        this.ctx.fillStyle = fs || '#000';
        this.ctx.strokeStyle = ss || '#000';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.stroke();
        
        return this;
    
    };

}
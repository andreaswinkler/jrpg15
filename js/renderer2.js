// the Renderer draws a given game state to the screen
// it also handles auto-resizing if the containers dimensions change
var Renderer = {

    container: null, 

    layers: {}, 

    sources: {
        map: null
    }, 

    init: function(container) {
    
        this.container = container;
        
        this.layers.map = new RenderLayer(500, 500);
        
        container.html(this.layers.map.canvases[0].canvas);
    
    }, 
    
    map: function(map) {
    
        return new Promise(function(resolve, reject) {
        
            console.log('Renderer.map', map.name);
            
            Renderer.sources.map = new RenderLayer(map._width, map._height);
            
            Assets.loadMany(['a1-cave-floor'])
                .then(Renderer._prepareMap);
        
        });
    
    },
    
    drawMapSection: function(x, y) {
    
        Renderer.layers.map.fillFrom(Renderer.sources.map, x, y);
    
    }, 
    
    drawTiles: function(renderLayer, tiles, asset) {
    
        var cnt = 0, 
            tileWidth = 160, 
            tileHeight = 80;
    
        _.each(tiles, function(tile, ind) {
            
            var x = ~~(tile.x / Core.TS * tileWidth), 
                y = ~~((tile.y / Core.TS * tileHeight) / 2);
            
            if (tile.x == 0) {
            
                cnt++;
            
            }

            if (cnt % 2 == 0) {
            
                x += tileHeight;
            
            } 

            renderLayer.drawSprite(x, y, asset, tile.sprite);
        
        });
    
    }, 

// PRIVATE SECTION /////////////////////////////////////////////////////////////
    
    /*
    *  all necessary assets have been loaded -> draw the map on the 
    *  map source canvas(ses)    
    */    
    _prepareMap: function(assets) {
    
        // create a new render layer with full map dimensions
        Renderer.sources.map = new RenderLayer(map._width, map._height);
    
        // draw all tiles to the render layer
        Renderer.drawTiles(Renderer.sources.map, map.grid, assets[0]);
    
        // TEMP: append the first canvas of the map to the stage
        //Renderer.container.html(Renderer.sources.map.canvases[0].canvas);
    
        // draw the upper-left map section
        Renderer.drawMapSection(0, 0);
    
    }

}

// the RenderLayer class represents one canvas and is used to ease the 
// communication with the canvas api 
var RenderLayer = function(width, height) {

    this.createCanvas = function(width, height, row, col) {
    
        var canvas = document.createElement('canvas');
        
        canvas.width = width;
        canvas.height = height;
        canvas._row = row;
        canvas._col = col;
        canvas._x = col * canvas.width;
        canvas._y = row * canvas.height;
        
        return {
            canvas: canvas,
            ctx: canvas.getContext('2d') 
        };
    
    };

    this.maxWidth = 8000;
    this.maxHeight = 8000;

    this.width = width;
    this.height = height;
    
    this.canvasWidth = this.width <= this.maxWidth ? this.width : this.maxWidth;
    this.canvasHeight = this.height <= this.maxHeight ? this.height : this.maxHeight;
    
    // the grid holds the amount of canvases [rows,cols] necessary 
    // to reflect the requested dimenstions
    this.grid = [Math.ceil(this.height / this.maxHeight), Math.ceil(this.width / this.maxWidth)];
    
    this.canvases = [];
    
    for (var i = 0; i < this.grid[0]; i++) {
    
        for (var j = 0; j < this.grid[i]; j++) {
        
            this.canvases.push(this.createCanvas(this.canvasWidth, this.canvasHeight, i, j));    
        
        }
    
    }
    
    // returns the (first or indexed) canvas dom element
    this.canvas = function(index) {
    
        return this.canvases[(index || 0)].canvas;
    
    };
    
    // clear the canvas from everything
    this.clear = function() {
    
        for (var i = 0; i < this.canvases.length; i++) {
        
            this.canvases[i].ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        }
    
        return this;  
    
    };
    
    // draw a single sprite from a sprite sheet
    this.drawSprite = function(x, y, spriteSheet, spriteIndex) {
        
        var row = ~~(spriteIndex / spriteSheet.cols), 
            col = spriteIndex - (row * spriteSheet.cols);
        
        this.drawOnCanvases(
            x, 
            y, 
            spriteSheet.asset, 
            spriteSheet.spriteWidth, 
            spriteSheet.spriteHeight, 
            col * spriteSheet.spriteWidth, 
            row * spriteSheet.spriteHeight    
        );
    
    };
    
    this.drawOnCanvases = function(x, y, source, width, height, sx, sy) {
        
        if (this.canvases.length == 1) {
            
            this.canvases[0].ctx.drawImage(source, sx, sy, width, height, x, y, width, height);    
        
        } else {
    
            var canvases = this.getAffectedCanvases(x, y, width, height), 
                    i;
    
            for (i = 0; i < canvases.length; i++) {
                
                canvases[i].ctx.drawImage(source, sx, sy, width, height, x - (canvases[i]._x), y - (canvases[i]._y), width, height);    
            
            } 
        
        }  
    
    };
    
    this.getAffectedCanvases = function(x, y, width, height) {
    
        return _.filter(this.canvases, function(i) {
           
            return Core.hitTestRects(
                [x, y, x + width, y + height], 
                [i.canvas._x, i.canvas._y, i.canvas._x + i.canvas.width, i.canvas._y + i.canvas.height]
            );
        
        });    
    
    };
    
    this.fillFrom = function(source, sx, sy) {
        
        this.drawOnCanvases(0, 0, source.canvases[0].canvas, this.canvasWidth, this.canvasHeight, sx, sy);

    };
    
    this.toImg = function() {
    
        var img = document.createElement('img');
        
        img.src = this.canvases[0].canvas.toDataURL();
    
        return img;

    };

}
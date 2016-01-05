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
            
            Renderer.sources.map = new RenderLayer(1000, 1000);
            
            Assets.loadMany(['a1-cave-floor', 'a1-cave-floor2'])
                .then(Renderer._prepareMap);
        
        });
    
    },
    
    drawMapSection: function(x, y, width, height) {
    
        Renderer.layers.map.fillFrom(Renderer.sources.map, x, y);
    
    }, 

// PRIVATE SECTION /////////////////////////////////////////////////////////////
    
    /*
    *  all necessary assets have been loaded -> draw the map on the 
    *  map source canvas(ses)    
    */    
    _prepareMap: function(assets) {
    
        var floorAsset = assets[0], 
            cnt = 0;
    
        Renderer.sources.map = new RenderLayer(map._width, map._height);
    
        _.each(map.grid, function(tile, ind) {
        
            var x = ~~(tile.x / 50 * 160), 
                y = ~~((tile.y / 50 * 80) / 2);
            
            if (tile.x == 0) {
            
                cnt++;
            
            }
            
            
            if (cnt % 2) {
            
                x += 80;
            
            }
        
            Renderer.sources.map.drawSprite(x, y, floorAsset, Core.randomInt(0, 30), Core.randomInt(0, 4));
        
        });
    
        Renderer.container.html(Renderer.sources.map.canvases[0].canvas);
    
        Renderer.drawMapSection(0, 0, 250, 250);
    
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
    
    // clear the canvas from everything
    this.clear = function() {
    
        for (var i = 0; i < this.canvases.length; i++) {
        
            this.canvases[i].ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        }
    
        return this;  
    
    };
    
    // draw a single sprite from a sprite sheet
    this.drawSprite = function(x, y, spriteSheet, row, col) {
        
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

}
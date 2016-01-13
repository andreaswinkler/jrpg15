// the Renderer draws a given game state to the screen
// it also handles auto-resizing if the containers dimensions change
var Renderer = {

    container: null,
    
    mode: 'default',  

    currentMap: null, 

    layers: {},
    
    tileWidth: 160, 
    tileHeight: 80,  

    sources: {
        map: null
    }, 
    
    root: {
        x: 0, 
        y: 0
    }, 

    init: function(container) {
    
        var width, height;
    
        this.container = container;
        
        width = this.container.width();
        height = this.container.height();
        
        this.layers.map = new RenderLayer(width, height);
        this.layers.interaction = new RenderLayer(width, height);
        
        container.append(this.layers.map.canvas());
        container.append(this.layers.interaction.canvas());
    
    }, 
    
    map: function(map) {
    
        Renderer.currentMap = map;
    
        return new Promise(function(resolve, reject) {
        
            Renderer.sources.map = new RenderLayer(map._width, map._height);
            
            Assets.loadMany([map.theme + '-floor'])
                .then(Renderer.prepareMap);
        
        });
    
    },
    
    drawMapSection: function() {
        
        Renderer.layers.map.fillFrom(
            Renderer.sources.map, 
            Renderer.root.x, 
            Renderer.root.y
        );
    
    }, 
    
    drawTiles: function(renderLayer, tiles, asset) {
    
        _.each(tiles, function(tile, ind) {
            
            var localCoords = Renderer.gridIndexToLocalCoordinates(tile.r, tile.c, { x: 0, y: 0 }), 
                x = localCoords[0], 
                y = localCoords[1];
            
            if (tile.spriteIndex != -1) {
                
                renderLayer.drawSprite(x, y, asset, tile.spriteIndex);
            
            } else if (Renderer.mode == 'editor') {
            
                renderLayer.draw(Renderer.customTile('empty', 'rgba(100,100,100,.5)'), x, y); 
            
            }
        
        });
    
    },

    gridIndexToLocalCoordinates: function(row, col, root) {
    
        var root = root || Renderer.root, 
            x = (col * Renderer.tileWidth) - root.x, 
            y = (row * (Renderer.tileHeight / 2)) - root.y;
        
        if (row % 2 == 0) {
        
            x += Renderer.tileHeight;
        
        }
        
        return [x, y];
    
    }, 

    convertScreenPositionToTile: function(x, y) {
      
        var globalX = Renderer.root.x + x, 
            globalY = Renderer.root.y + y, 
            col = ~~(globalX / Renderer.tileWidth), 
            row = ~~(globalY / (Renderer.tileHeight / 2)), 
            localCoords = Renderer.gridIndexToLocalCoordinates(row, col);  
      
        return {
            x: localCoords[0], 
            y: localCoords[1],  
            r: row, 
            c: col
        };
    
    },  
    
    setRoot: function(x, y) {
    
        Renderer.root.x = x;
        Renderer.root.y = y;
    
    }, 

// PRIVATE SECTION /////////////////////////////////////////////////////////////
    
    source: function(key, createFunc) {
    
        if (!this.sources[key]) {
        
            this.sources[key] = createFunc();
        
        }
        
        return this.sources[key];
    
    }, 
    
    customTile: function(key, ss, fs) {
    
        var key = 'tile-' + key;
    
        return Renderer.source(key, function() {
        
            var width = Renderer.tileWidth, 
                height = Renderer.tileHeight, 
                layer = new RenderLayer(width, height);
            
            layer.diamond(0, 0, width, height, ss, fs);
        
            return layer.canvas(); 
        
        });  
    
    }, 
    
    /*
    *  all necessary assets have been loaded -> draw the map on the 
    *  map source canvas(ses)    
    */    
    prepareMap: function(assets) {
        
        var map = Renderer.currentMap;
    
        // create a new render layer with full map dimensions
        Renderer.sources.map = new RenderLayer(map.width * Renderer.tileWidth, ~~(map.height * Renderer.tileHeight / 2));
    
        // draw all tiles to the render layer
        Renderer.drawTiles(Renderer.sources.map, map.grid, assets[0]);
    
        // TEMP: append the first canvas of the map to the stage
        //Renderer.container.html(Renderer.sources.map.canvases[0].canvas);
    
        // draw the upper-left map section
        // add half tileWidth/tileHeight to hide zig-zag
        Renderer.setRoot(Renderer.tileWidth / 2, Renderer.tileHeight / 2);
        
        Renderer.drawMapSection(Renderer.root.x, Renderer.root.y);
    
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
    this.drawSprite = function(x, y, spriteSheet, spriteIndex, sw, sh) {
        
        var row, col;
        
        if (spriteIndex != -1) {
        
            row = ~~(spriteIndex / spriteSheet.cols), 
            col = spriteIndex - (row * spriteSheet.cols);
            
            this.drawOnCanvases(
                x, 
                y, 
                spriteSheet.asset, 
                spriteSheet.spriteWidth, 
                spriteSheet.spriteHeight, 
                col * spriteSheet.spriteWidth, 
                row * spriteSheet.spriteHeight, 
                sw, 
                sh    
            );
        
        } 
    
    };
    
    this.draw = function(source, x, y, width, height, sx, sy, sw, sh) {
    
        var x = x || 0, 
            y = y || 0, 
            width = width || source.width, 
            height = height || source.height, 
            sx = sx || 0, 
            sy = sy || 0, 
            sw = sw || width, 
            sh = sh || height;
        
        this.drawOnCanvases(x, y, source, width, height, sx, sy, sw, sh);
    
    };
    
    this.drawOnCanvases = function(x, y, source, width, height, sx, sy, sw, sh) {
        
        var sw = sw || width, 
            sh = sh || height;
        
        if (this.canvases.length == 1) {
            
            this.canvases[0].ctx.drawImage(source, sx, sy, width, height, x, y, sw, sh);    
        
        } else {
    
            var canvases = this.getAffectedCanvases(x, y, width, height), 
                i;
    
            for (i = 0; i < canvases.length; i++) {
                
                canvases[i].ctx.drawImage(source, sx, sy, width, height, x - (canvases[i]._x), y - (canvases[i]._y), sw, sh);    
            
            } 
        
        }  
    
    };
    
    this.getAffectedCanvases = function(x, y, width, height) {
    
        if (this.canvases.length == 1) {
        
            return this.canvases[0];
        
        } else {
    
            return _.filter(this.canvases, function(i) {
               
                return Core.hitTestRects(
                    [x, y, x + width, y + height], 
                    [i.canvas._x, i.canvas._y, i.canvas._x + i.canvas.width, i.canvas._y + i.canvas.height]
                );
            
            }); 
            
        }   
    
    };
    
    this.fillFrom = function(source, sx, sy) {
        
        this.drawOnCanvases(0, 0, source.canvases[0].canvas, this.canvasWidth, this.canvasHeight, sx, sy);

    };
    
    this.toImg = function() {
    
        var img = document.createElement('img');
        
        img.src = this.canvases[0].canvas.toDataURL();
    
        return img;

    };
    
    // works only with one canvas render layers!!!
    this.point = function(x, y, fs) {
        
        var canvas = this.getAffectedCanvases(x, y, 1, 1);
        
        this.setStyles(canvas.ctx, null, fs);

        canvas.ctx.fillRect(x, y, 1, 1);            
    
    };
    
    this.diamond = function(x, y, width, height, ss, fs) {
    
        this.path([
            [x, y + height / 2], 
            [x + width / 2, y], 
            [x + width, y + height / 2], 
            [x + width / 2, y + height]    
        ], ss, fs);
    
    };
    
    this.path = function(points, ss, fs) {
    
        var canvas = this.getAffectedCanvases(points[0][0], points[0][1], 1, 1), 
            i;

        this.setStyles(canvas.ctx, ss, fs);
        
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(points[0][0], points[0][1]);
        
        for (i = 1; i < points.length; i++) {
        
            canvas.ctx.lineTo(points[i][0], points[i][1]);    
        
        }
        
        canvas.ctx.closePath();
        canvas.ctx.stroke();
    
    }
    
    this.setStyles = function(ctx, ss, fs) {
    
        if (ss) {
        
            ctx.strokeStyle = ss;
        
        }
        
        if (fs) {
        
            ctx.fillStyle = fs;
        
        }
    
    } 

}
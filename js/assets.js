// handles everything regarding loading and disposing of media assets
// textures, graphics, sounds, etc
// Renderer, UI and Audio have access to assets
var Assets = {

    // here we store all loaded assets
    // they should be accessed via the get(assetId) method
    store: {}, 
    
    // the quality attribute defines from which folder we load 
    // the assets
    // possible values are low, medium and high
    // the setting should only be set on startup
    quality: 'medium', 
    
    dir: 'assets/medium/',

    // this method is used to extract all assetIds from a list of objects
    // the list contains not only the assets of the objects themselves 
    // but also any pre-requisites they might specify
    listFromObjects: function(objects) {

        var list = [];
        
        // we loop through all objects and collect the required assets ids 
        // and the asset id
        // we end up with a plain array of all asset ids we should load
        _.each(objects, function(e) {
                    
            if (e.reqAssets && e.reqAssets.length > 0) {

                list = list.concat(e.reqAssets);
            
            }
            
            if (e.assetId) {
            
                list.push(e.assetId);
            
            }
        
        });

        return list;
    
    }, 

    // this is a specialized method to extract all assetIds from the game state
    listFromGameState: function(gameState) {
    
        return Assets.listFromObjects(gameState.elements.concat(gameState.map));
    
    }, 

    // this method is used to load a list of assets referenced by their ids
    // params:
    //    assets: list of assetIds (e.g. [desert.png, hero.png])
    //    success [optional]: callback function to be called once all assets 
    //                        are loaded
    //    status [optional]: a reference to an status array of a progress bar 
    //                       first field increases with each asset loaded
    load: function(assets, success, status) {
    
        var status = status || [];
        
        if (assets.length > 0) {
        
            status[0]++;
            
            Assets.loadSingle(assets.shift(), Assets.load, [assets, success, status]);
    
        } else if (success) {
        
            success();
        
        }
    
    }, 
    
    // this method is used to load a single asset by its id
    // params:
    //    assetId: the assetId (string)
    //    success [optional]: callback function to be called once the asset 
    //                        was loaded successfully
    //    params [optional]: any params to be passed to the callback function    
    loadSingle: function(assetId, success, params) {
    
        var a;
    
        // check if we not already have loaded the asset in question
        if (!Assets.store[assetId]) {
        
            // load a simple png image [async]
            if (assetId.indexOf('.png') != -1) {
        
                a = new Image();
                a.src = Assets.dir + assetId;

                // if a callback was specified we bind it to the images 
                // onload event
                if (success) {
                
                    a.onload = function() {
                    
                        success.apply(this, params);
                    
                    };
                
                }
            
            } 
            // create a map canvas [sync]
            else if (assetId.indexOf('map-') != -1) {
            
                a = Renderer.prepareMap(Game.state.map);
                
                // the map canvas was created, we can invoke the 
                // callback right away
                if (success) {
                                
                    success.apply(this, params);
                
                }                    
            
            }
        
            Assets.store[assetId] = a;
        
        }
        // if we already have the asset we call the success method 
        // right away 
        else if (success) {
        
            success.apply(this, params);
            
        }
    
    }, 
    
    // load an media file by obj.assetId
    get: function(obj) {
        
        var obj = typeof obj == 'string' || obj instanceof String ? { assetId: obj } : obj;
        
        // if we can't find the texture for the requested object
        // we try to lazy load it
        if (!Assets.store[obj.assetId]) {
        
            Assets.load(Assets.listFromObjects([obj]));
        
        } 
        
        // afterwards we can safely return the asset referenced by the 
        // assetId. If it's still loading, an empty image is returned
        return Assets.store[obj.assetId];
    
    }, 
    
    // get the background setting for an item from a sprite sheet
    background: function(asset) {
    
        return this.backgroundCSS(
            Assets.dir + asset[0], 
            asset[1] * Core.Settings.assets[asset[0]].spriteDimensions[0] * -1, 
            asset[2] * Core.Settings.assets[asset[0]].spriteDimensions[1] * -1
        );
    
    }, 
    
    backgroundCSS: function(url, hpos, vpos) {
    
        return 'background-image:url(' + url + ');background-position:' + hpos + 'px ' + vpos + 'px';
    
    }, 
    
    // get the rarity background for a given item
    rankBackground: function(item) {
    
        return this.backgroundCSS(
            Assets.dir + 'item-ranks.png', 
            [F.NORMAL, F.MAGIC, F.RARE, F.SET, F.LEGENDARY].indexOf((Utils.itemRank(item)[0])) * Core.Settings.assets['item-ranks.png'].spriteDimensions[0] * -1, 
            0
        );
    
    }, 
    
    preRenderParticleSystem: function(id, settings) {
    
        var c = document.createElement('canvas'),
            ct = document.createElement('canvas'),  
            ctx = c.getContext('2d'), 
            ctxt = ct.getContext('2d'), 
            totalFramesWidth = settings.frames * settings.frameWidth, 
            framesWidth = Math.min(8000, totalFramesWidth), 
            framesHeight = Math.ceil(totalFramesWidth / 8000) * settings.frameHeight,
            particleEmitter = new ParticleEmitter(),
            startFrame = settings.startFrame || 0, 
            row = -1,   
            i;
        
        c.width = settings.frameWidth;
        c.height = settings.frameHeight;
        
        ct.width = framesWidth;
        ct.height = framesHeight;
        
        particleEmitter = $.extend(particleEmitter, settings.particleEmitter);
        
        particleEmitter.init();
        
        for (i = 0; i < startFrame + settings.frames; i++) {
        
            // render frame to temp canvas
            c.clearRect(0, 0, c.width, c.height);
            
            ctx.save();
            ctx.globalCompositionOperation = 'lighter';
            
            particleEmitter.render(ctx);
            
            ctx.restore();
            
            // put rendered frame to sprite sheet
            if (i >= startFrame) {
            
                if ((i - startFrame) % 10 == 0) {
                
                    row++;
                
                }            
            
            }
            
            ctxt.drawImage(c, ((i - startFrame) % 10) * frameWidth, row * frameHeight, frameWidth, frameHeight);
        
        }
        
        Assets.store[id] = ct;        
    
    }

}
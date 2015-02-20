// handles everything regarding loading and disposing of media assets
// textures, graphics, sounds, etc
// Renderer, UI and Audio have access to assets
var Assets = {

    // here we store all loaded assets
    // they should be accessed via the get(assetId) method
    store: {}, 
    
    // the quality attribute defines which from which folder we load 
    // the assets
    // possible values are low, medium and high
    // the setting should only be set on startup
    quality: 'medium', 
    
    // here we store the meta information of our assets
    // TODO: this should be loaded from somewhere
    meta: {
        'desert.png': {
            spriteDimensions: [64,32]
        }, 
        'hero.png': {
            spriteDimensions: [200, 200], 
            hitboxOffset: [60, 40, 60, 0]
        }
    }, 

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
    
        return Assets.listFromObjects(gameState.elements.concat(gameState.map).concat(gameState.hero));
    
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
                a.src = 'assets/' + Assets.quality + '/' + assetId;

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
    
    }

}
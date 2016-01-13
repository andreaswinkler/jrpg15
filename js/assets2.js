var Assets = {

    cache: {}, 
    
    theme: 'd2',
    base: '',  
    
    load: function(assetKey) {
    
        console.log('Assets.load', assetKey);
    
        return new Promise(function(resolve, reject) {
        
            var img;
            
            if (Assets.cache[assetKey]) {
            
                resolve(Assets.cache[assetKey]);
            
            } else {
            
                img = new Image();
            
                img.onload = function() {
                
                    Assets.cache[assetKey] = { 
                        key: assetKey, 
                        asset: this, 
                        spriteWidth: 160, 
                        spriteHeight: 80, 
                        rows: 40, 
                        cols: 5 
                    };
                    
                    resolve(Assets.cache[assetKey]);
                
                };
                
                img.onerror = function(err) {
                
                    reject(Error(err));
                
                };
                
                img.src = Assets.base + 'assets/' + Assets.theme + '/' + assetKey + '.png';
            
            } 
        
        });    
    
    },
    
    loadMany: function(assetKeys) {
    
        return Promise.all(assetKeys.map(Assets.load));    
    
    }, 
    
    toSpriteSheet: function(asset) {
    
        var sprites = [], 
            canvas, i, j;
        
        for (i = 0; i < asset.rows; i++) {
        
            for (j = 0; j < asset.cols; j++) {
        
                canvas = new RenderLayer(asset.spriteWidth, asset.spriteHeight);

                canvas.drawSprite(0, 0, asset, i * asset.cols + j);
                
                sprites.push(canvas);
            
            } 
        
        } 
        
        return sprites;          
    
    }

}                    
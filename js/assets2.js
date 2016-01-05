var Assets = {

    cache: {}, 
    
    theme: 'd2', 
    
    load: function(assetKey) {
    
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
                        spriteHeight: 80 
                    };
                    
                    resolve(Assets.cache[assetKey]);
                
                };
                
                img.onerror = function(err) {
                
                    reject(Error(err));
                
                };
                
                img.src = 'assets/' + Assets.theme + '/' + assetKey + '.png';
            
            } 
        
        });    
    
    },
    
    loadMany: function(assetKeys) {
    
        return Promise.all(assetKeys.map(Assets.load));    
    
    }    

}                    
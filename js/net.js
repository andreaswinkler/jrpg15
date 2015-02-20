// handles all connection stuff with node.js
var Net = {

    offline: true, 

    send: function(msg, data, success) {
    
        if (Net.offline) {
        
            Net.sendStub(msg, data, success);
        
        } else {
    
            success();
        
        }
    
    }, 
    
    sendStub: function(msg, data, success) {
    
        switch (msg) {
        
            case 'join': 
            case 'create':
            
                var gameState = { 
                        elements: [], 
                        map: { 
                            assetId: 'map-playground', 
                            reqAssets: ['desert.png'],
                            theme: 'desert.png', 
                            width: 6400, 
                            height: 3200,  
                            grid: {
                                rows: 100, 
                                cols: 100, 
                                tiles: []
                            } 
                        }, 
                        hero: { 
                            assetId: 'hero.png',
                            id: 1, 
                            x: 1000, 
                            y: 1000, 
                            speed: 1  
                        } 
                    };
            
                for (var i = 0; i < gameState.map.grid.cols; i++) {
                
                    for (var j = 0; j < gameState.map.grid.rows; j++) {
                    
                        gameState.map.grid.tiles.push({ name: i + '_' + j, walkable: true });
                    
                    }
                
                }
                
                gameState.elements.push(gameState.hero);
            
                success(gameState);
            
                break;
            
            case 'ready':
            
                success();
                
                break;
        
        }
    
    },     

}
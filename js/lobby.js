/*
** L O B B Y
** 
** handles everything in regards to game lobby functionalities
*/
var Lobby = {

    // the logged in user if any
    user: null, 

    // Lobby.init is the first method to be called. It initalizes the user 
    // interface and sets everything up.
    // the whole game is fitted inside the passed container which needs 
    // to be a jquery object
    init: function(container) {
    
        UI.init(container);
        
        console.log('Initalized. v0.1');
        
        // TODO: handle login and stuff !!!
        UI.user = { id: 1, name: 'Andi' };
    
    }, 

    // this method is used to join an existing public game based on the 
    // game id. 
    // use this to join a game from the public game list
    join: function(gameId) {
    
        Net.send('join', [gameId], Lobby.startGame);
    
    }, 
    
    // this method is used to create a new game after selecting a 
    // map from the list of available ones
    newGame: function(mapId) {
    
        Net.send('create', [mapId], Lobby.startGame);
    
    }, 
    
    // start game is called after a game state was loaded
    // this can be done by creating or joining a game or by switching 
    // to a different map within a running game 
    startGame: function(gameState) {
    
        var assetList = [];
    
        // init the game with the new game state
        Game.start(gameState);
        
        // show a loading screen
        UI.screen('loading');
        
        // load everything
        Assets.load(Assets.listFromGameState(gameState), Lobby.onGameReady);    
    
    }, 
    
    // this is called after everything was loaded for the current game
    // the client informs the server about this and the server 
    // adds the player to the game
    onGameReady: function() {
    
        // render the first frame
        Renderer.draw(Game.state);
        
        // announce that we are ready
        Net.send('ready', [], Lobby.onGameJoined);               
    
    }, 
    
    // the server has added the player to the current game, now
    // we can display and run the game
    onGameJoined: function() {
         
        // show the game screen
        UI.screen('game');
        
        // run the game
        Game.run();
    
    }
    
}
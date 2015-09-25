// handles all connection stuff with node.js
var Net = {

    offline: false,
    
    socket: null, 
    
    onConnect: null,
    
    envelopes: {
        status: ['players', 'games', 'msAvgServerLoop'], 
        gameCreate: ['players', 'isPublic', 'isPaused', 'tsStart'], 
        login: ['_id', 'name', 'hero', 'balance', 'buddies'], 
        map: ['_id', 'name', 'level', 'grid', 'width', 'height', '_width', '_height', 'updates']
    },      
                      
    init: function(success) {
    
        Net.onConnect = success;
    
        Net.socket = io.connect('http://localhost:1337', { 'force new connection': true }); 
        
        Net.socket.on('greeting', function(data) {
        
            console.log('Connected with jrpg-server v' + data.version);
            
            Net.onConnect();
        
        });
        
        Net.socket.on('error', function() {
            
            if (!Net.socket.socket.connected) {
            
                Net.onDisconnect();
            }

        });
        
        // we got disconnected from the server
        // let's try to reconnect
        Net.socket.on('disconnect', Net.onDisconnect);

    },
    
    onDisconnect: function() {
    
        console.warn('jrpg-server has gone away.');
        
        // show an empty screen
        UI.screen();
                
        // show an error message and bind the init 
        // method to the 'ok' button
        UI.alert('Server Unavailable', Net.init, [Net.onConnect]);

    },  

    send: function(msg, data, success, returnMsg) {
    
        console.log('send <' + msg + '>' + (msg == 'cmd' ? ' <' + data[0] + '>' : ''));
        
        if (success) {
        
            Net.bind(msg, success, returnMsg);
        
        }

        Net.socket.emit(msg, data);
    
    }, 
    
    openEnvelope: function(msg, data, msRoundtrip) {
        
        //console.log('openEnvelope', msg, msRoundtrip, data);
    
        return Net.envelopes[msg] ? _.reduce(data, function(obj, e, ind) { obj[Net.envelopes[msg][ind]] = e; return obj; }, {}) : data;

    }, 
    
    bind: function(msg, success, returnMsg) {
    
        var tsStart = +new Date(), 
            callback = function(data) {
            var data = Net.openEnvelope(returnMsg || msg, data, +new Date() - tsStart);
            success(data);        
        
        };
    
        Net.socket.removeAllListeners(returnMsg || msg);    
        
        Net.socket.on(returnMsg || msg, callback);
    
    } 

}
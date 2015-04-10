// handles all connection stuff with node.js
var Net = {

    offline: false,
    
    socket: null, 
    
    onConnect: null,  

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
        
            Net.socket.removeListener(returnMsg || msg, success);
            Net.socket.on(returnMsg || msg, success);
        
        }
    
        Net.socket.emit(msg, data);
    
    }, 
    
    bind: function(msg, success) {
    
        Net.socket.removeListener(msg, success);    
        Net.socket.on(msg, success);
    
    } 

}
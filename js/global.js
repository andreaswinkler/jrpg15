var Utils = Core.Utils,
    F = Core.Flags, 
    K = [];
        
_.each(F, function(value, key) {
    
    K[value] = key;

});  

function _center() {

    $('.center').each(function(ind, e) {
        
        var e = $(e);
        
        e.css('margin-left', '-' + (e.width() / 2) + 'px');
        e.css('margin-top', '-' + (e.height() / 2) + 'px');
    
    });

}

$(document).ready(function(ev) {

    $(window).resize(function(ev) {
    
        _center();
    
    });

    $(window).trigger('resize');
    
    if (typeof(Lobby) !== 'undefined') {
    
        Lobby.init($('body'), function() {
        
            Net.send('login', { playername: '1983', password: '' }, function(data) {
            
                Lobby.onLogin(data);
                
                UI.currentScreen.find('.creategame').trigger('click');
            
            });
        
        });
    
    }

});
var Sound = {

    muteMusic: false, 
    muteFX: false,
    store: {},
    
    load: function(key) {
    
        console.log('Sound load <' + key + '>');
    
        var a = new Audio('assets/snd/' + key + '.mp3?' + Math.random());
        
        a.key = key;
        a.volume = 1;

        $(a).bind('canplaythrough', function(ev) {
        
            ev.currentTarget.volume = Sound.getVolume(ev.currentTarget.key);
        
        });
        
        this.store[a.key] = a;
    
    }, 
    
    getVolume: function(key) {
    
        return 1;
    
    }, 
    
    play: function(key, loop) {
    
        console.log('Sound play <' + key + '>');
    
        if (!this.store[key]) {
        
            this.load(key);
        
        } else if (this.store[key].readyState == 4) {
        
            this.store[key].currentTime = 0;
            this.store[key].play();    
        
        }
    
    }

}
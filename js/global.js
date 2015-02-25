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

});
(function(){

    window.Helpers = {};
    
    Helpers.encodeData = function(data) {
        return Object.keys(data).map(function(key) {
            return [key, data[key]].map(encodeURIComponent).join("=");
        }).join("&");
    }

})();

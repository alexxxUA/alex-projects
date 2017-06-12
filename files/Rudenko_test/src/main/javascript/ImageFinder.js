(function(){
    
    var ImageFinder = window.CLASSES.ImageFinder = function(){
        this._searchXhr = null;
    };

    ImageFinder.prototype.search = function(query, moduleId, argCtx) {
        var moduleId = moduleId || 'static',
            ctx = argCtx || this;

        if (typeof this[moduleId] == 'undefined')
            throw 'Unknown module' 

        return this[moduleId](query, ctx);

    },

    ImageFinder.prototype.static = function(query) {

        var data = window.DATA.staticImagesData;

        var results = data.filter(function(item){
            var title = item.title.toLowerCase();
            var q = query.toLowerCase();

            return title.indexOf(q) != -1;
        })
        .map(function(item){

            var rObj = {};
            var fieldToInclude = ['id','url','title']
        
            for (var i = 0; i < fieldToInclude.length; i++) {
                var prop = fieldToInclude[i];
                if (typeof prop != 'undefined')
                    rObj[prop] = item[prop]
            }
            
            return rObj;
        })

        return Promise.resolve({
            query: query,
            images: results
        });
    },

    ImageFinder.prototype.flickr = function(query, ctx) {
        var self = this;
        var results= [];
        var settings = {
            tags: query,
            api_key: 'b394136d5dde8d9d0d4f8fc6685386e2',
            method: 'flickr.photos.search',
            page: 1,
            format: 'json',
            nojsoncallback: 1
        };

        var apiUrl = 'https://api.flickr.com/services/rest/?';


        var pebis =  httpGet(apiUrl + Helpers.encodeData(settings)).then(function(response){
            var data = JSON.parse(response);

            results = data.photos.photo.map(function(item){

                var rObj = {
                    id: item.id,
                    url: self.generateFlickrPhotoUrl(item),
                    title: item.title,
                };

                return rObj;
            })

            return {
                query: query,
                images: results
            };
        })

        function httpGet(url) {

            return new Promise(function(resolve, reject) {
                if(ctx._searchXhr && ctx._searchXhr.readyState != 4){
                    ctx._searchXhr.abort();
                }
                ctx._searchXhr = new XMLHttpRequest();
                ctx._searchXhr.open('GET', url, true);

                ctx._searchXhr.onload = function() {
                    if (this.status == 200) {
                        resolve(this.response);
                    } else {
                        var error = new Error(this.statusText);
                        error.code = this.status;
                        reject(error);
                    }
                };

                ctx._searchXhr.onerror = function() {
                    reject(new Error("Network Error"));
                };

                ctx._searchXhr.send();
            });

        }

        return pebis;
    },

    ImageFinder.prototype.generateFlickrPhotoUrl = function(photo) {
        return 'http://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '.jpg';
    }

})();

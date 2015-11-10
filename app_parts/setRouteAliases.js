var path = require('path'),
	Aliases = require('./aliases_schema.js');

function init(app, callback){
    Aliases.find({}, function(err, aliases){
        if(err) throw err;

        aliases.forEach(function(alias, index){
            app.get('/'+ alias.alias, function(req, res){
                res.redirect('/'+ alias.path); 
            });

            //Fire callback
            if(index + 1 == aliases.length)
                callback();
        });
    });
}

module.exports.init = init;
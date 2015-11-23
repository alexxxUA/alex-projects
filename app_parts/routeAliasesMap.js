var path = require('path'),
	Aliases = require('./aliases_schema.js'),
	aliasesMap = {};

function getMap(callback){
	Aliases.find({}, function(err, aliases){
		if(err) throw err;

		aliases.forEach(function(alias){
			aliasesMap[alias.alias] = alias.path;
		});
		callback(aliasesMap);
	});	
}

module.exports = getMap;
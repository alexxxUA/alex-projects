const Aliases = require('./aliases_schema.js');

function getMap(callback){
	Aliases.find({}, function(err, aliases){
		if(err) throw err;

		let aliasesMap = {}

		aliases.forEach(function(alias){
			aliasesMap[alias.alias] = alias.path;
		});
		callback(aliasesMap);
	});	
}

module.exports = getMap;
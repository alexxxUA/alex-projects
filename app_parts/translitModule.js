var translitMap = require('./translitMap.js'),
    translit = require('translit')(translitMap);

module.exports = translit;

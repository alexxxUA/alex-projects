/***
	Available properties for channel:

		dName - used for display name (text representative of channel)
		sName - used like regExp for search channel in playlist
		flags - 'req', 'hd'
***/

var channelList = [
	//Украинские
	{dName: '1+1', sName: '1\\+1', flags: 'req'},
	{dName: 'СТБ', sName: 'СТБ|СТБ Украина', flags: 'req'},
	{dName: 'Новый канал', sName: 'Новый канал|Новий канал', flags: 'req'},
	{dName: 'ICTV', sName: 'ICTV', flags: 'req'},
	{dName: '2+2', sName: '2\\+2', flags: 'req'},
	{dName: 'ТЕТ', sName: 'ТЕТ', flags: 'req'},
	{dName: 'Интер', sName: 'Интер', flags: 'req'},
	{dName: 'ТРК Украина', sName: 'ТРК Украина', flags: ''},
	{dName: 'К1', sName: 'К1', flags: 'req'},
	{dName: 'К2', sName: 'К2', flags: 'req'},
	{dName: '2x2', sName: '2x2', flags: 'req'},
	{dName: 'СТС', sName: 'СТС', flags: 'req'},
	{dName: 'ТНТ', sName: 'ТНТ', flags: 'req'},
	{dName: 'Перец', sName: 'Перец', flags: ''},

	//Познавательные
	{dName: 'Мега', sName: 'Мега', flags: 'req'},
	{dName: 'QTV', sName: 'QTV', flags: 'req'},
	{dName: 'Viasat Explore', sName: 'Viasat Explore|Viasat Explorer', flags: 'req'},
	{dName: 'Discovery Investigation', sName: 'Discovery Investigation|Investigation Discovery Europe', flags: ''},
	{dName: 'Discovery World', sName: 'Discovery World|Discovеry Wоrld', flags: ''},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', flags: 'req'},
	{dName: 'Discovery HD Showcase', sName: 'Discovery HD Showcase|Discovery Showcase HD', flags: ''},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', flags: 'hd req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'hd req'},
	{dName: 'History Channel', sName: 'History Channel', flags: 'hd req'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', flags: 'hd req'},
	{dName: 'Nat Geo Wild', sName: 'Nat Geo Wild|Nаt Geо Wild', flags: 'hd req'},
	{dName: 'Моя Планета', sName: 'Моя Планета', flags: 'req'},
	{dName: 'Техно 24', sName: 'Техно 24|24 Техно', flags: ''},
	{dName: 'НЛО ТВ', sName: 'НЛО ТВ|НЛО TV', flags: ''},
	{dName: 'Travel channel', sName: 'Travel channel', flags: ''},
	{dName: 'Драйв ТВ', sName: 'Драйв ТВ', flags: ''},
	{dName: 'Extreme Sports', sName: 'Extreme Sports', flags: ''},
	{dName: 'English Club TV', sName: 'English Club TV|EnglishClub TV', flags: ''},

	//Фильмы
	{dName: 'Fox Life', sName: 'Fox Life', flags: ''},
	{dName: 'TV 1000', sName: 'TV 1000|TV1000', flags: 'req'},
	{dName: 'TV 1000 ACTION', sName: 'TV 1000 ACTION|TV 1000 Action East', flags: 'req'},
	{dName: 'TV1000 Comedy', sName: 'TV1000 Comedy', flags: 'hd req'},
	{dName: 'TV1000 Megahit', sName: 'TV1000 Megahit', flags: 'hd req'},
	{dName: 'TV1000 Premium', sName: 'TV1000 Premium', flags: 'hd req'},
	{dName: 'Amedia 1', sName: 'Amedia 1', flags: ''},
	{dName: 'Amedia 2', sName: 'Amedia 2', flags: ''},
	{dName: 'Amedia Premium', sName: 'Amedia Premium', flags: 'hd req'},
	{dName: 'SET', sName: 'SET|SET HD \\\(SONY\\\)', flags: 'hd req'},
	{dName: 'HD Кино 2', sName: 'HD Кино 2', flags: 'req'},

	//Музыка
	{dName: 'MTV Hits', sName: 'MTV Hits|MTV Hits UK', flags: ''},
	{dName: 'MTV Dance', sName: 'MTV Dance', flags: ''},
	{dName: 'Music Box UA', sName: 'Music Box UA', flags: ''},
	{dName: 'М1', sName: 'М1', flags: 'req'},
	{dName: 'М2', sName: 'М2', flags: ''},
	{dName: 'O-TV', sName: 'O-TV', flags: 'req'},
	{dName: 'A-ONE', sName: 'A-ONE', flags: ''},

	//Мультики
	{dName: 'Cartoon Network', sName: 'Cartoon Network', flags: 'req'},
	{dName: 'Disney Channel', sName: 'Disney Channel', flags: 'req'},
	{dName: 'Nickelodeon', sName: 'Nickelodeon', flags: 'hd req'},
	{dName: 'Детский', sName: 'Детский', flags: ''},
	{dName: 'Мультимания', sName: 'Мультимания', flags: ''}
];

var channelRegExps = function(channel, isReserve){
	var isHd = channel.isHd ? '(?:hd|cee)' : '',
		reserve = isReserve ? '(?:.+резерв.+)' : '',
		regExp = null;

	if(this.validList.type == 'm3u')
		regExp = new RegExp('(?:EXTINF\:0,\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*' + reserve + '\\s*\\n+(.*))', 'im');
	else if(this.validList.type == 'xspf')
		regExp = new RegExp('(?:<location>)(.*?)(?:</location>\\s*\\n*\\s*<title>\\s*(?:.*' + channel.sName + ')\\s*' + isHd + '\\s*' + reserve + '\\s*</title>)', 'im');

	return regExp;
}

//Export channel list for server side
if(typeof module != 'undefined'){
	module.exports = {
		channelList: channelList,
		channelRegExps: channelRegExps
	};
}
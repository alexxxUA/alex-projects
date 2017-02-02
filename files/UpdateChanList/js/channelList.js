/***
	Available properties for channel:

		dName - used for display name (text representative of channel)
		sName - used like regExp for search channel in playlist
		flags - 'req', 'hd'
***/

var channelList = [
	//Украинские
	{dName: '1+1', sName: '1\\+1(?!\\s*international)', flags: 'req'},
	{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ  \\(UA\\)', flags: 'req'},
	{dName: 'Новый канал', sName: 'Новый канал|Новий канал', flags: 'req'},
	{dName: 'ICTV', sName: 'ICTV', flags: 'req'},
	{dName: '2+2', sName: '2\\+2', flags: 'req'},
	{dName: 'ТЕТ', sName: 'ТЕТ', flags: 'req'},
	{dName: 'Интер', sName: 'Интер', flags: ''},
	{dName: 'ТРК Украина', sName: 'ТРК Украина', flags: ''},
	{dName: 'К1', sName: 'К1', flags: 'req'},
	{dName: 'К2', sName: 'К2', flags: 'req'},
	{dName: '2x2', sName: '2x2', flags: 'req'},
	{dName: 'Мама', sName: 'Мама|mama', flags: ''},
	{dName: 'СТС', sName: 'СТС', flags: 'req'},
	{dName: 'ТНТ', sName: 'ТНТ', flags: 'req'},
	{dName: 'Перец', sName: 'Перец', flags: ''},

	//Познавательные
	{dName: 'Мега', sName: 'Мега', flags: 'req'},
	{dName: 'QTV', sName: 'QTV', flags: 'req'},
	{dName: 'Еда ТВ', sName: '(Еда ТВ|Еда)', flags: ''},
	{dName: 'Кухня ТВ', sName: 'Кухня ТВ', flags: 'req'},
	{dName: 'Food Network', sName: 'Food Network', flags: 'hd'},
	{dName: 'Viasat Explore', sName: 'Viasat Explore|Viasat Explorer', flags: 'req'},
	{dName: 'Viasat History', sName: 'Viasat History', flags: 'req'},
	{dName: 'Viasat Nature-History', sName: 'Viasat Nature-History', flags: 'hd req'},
	{dName: 'Discovery Investigation', sName: 'Discovery Investigation|Investigation Discovery Europe', flags: ''},
	{dName: 'Discovery World', sName: 'Discovery World|Discovеry Wоrld', flags: ''},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', flags: 'req'},
	//{dName: 'Discovery HD Showcase', sName: 'Discovery HD Showcase|Discovery Showcase HD', flags: ''},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', flags: 'hd req'},
	{dName: 'Discovery Showcase HD', sName: 'Discovery HD Showcase', flags: 'req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'hd req'},
	{dName: 'History Channel', sName: 'History Channel|History', flags: 'hd req'},
	{dName: 'TLC', sName: 'TLC', flags: 'hd'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', flags: 'hd req'},
	{dName: 'Nat Geo Wild', sName: 'Nat Geo Wild|Nаt Geо Wild', flags: 'hd req'},
	{dName: 'Наука 2.0', sName: 'Наука 2.0', flags: 'req'},
	{dName: 'Моя Планета', sName: 'Моя Планета', flags: 'req'},
	{dName: 'Техно 24', sName: 'Техно 24|24 Техно', flags: ''},
	{dName: 'НЛО ТВ', sName: 'НЛО ТВ|НЛО TV', flags: ''},
	{dName: 'Travel channel', sName: 'Travel channel', flags: ''},
	{dName: 'Драйв ТВ', sName: 'Драйв ТВ', flags: ''},
	{dName: 'Первый автомобильный', sName: 'Первый автомобильный \\(?Украина\\)?', flags: ''},
	{dName: 'Extreme Sports', sName: 'Extreme Sports', flags: ''},
	{dName: 'English Club TV', sName: 'English Club TV|EnglishClub TV', flags: ''},

	//Фильмы
	{dName: 'Fox', sName: 'Fox\\.', flags: 'req'},
	{dName: 'Fox Life', sName: 'Fox Life', flags: 'hd req'},
	{dName: 'TV 1000', sName: 'TV\\s?1000', flags: 'req'},
	{dName: 'TV 1000 ACTION', sName: 'TV 1000 ACTION|TV 1000 Action East', flags: 'req'},
	{dName: 'TV1000 Comedy', sName: 'TV\\s?1000 Comedy', flags: 'hd req'},
	{dName: 'TV1000 Megahit', sName: 'TV\\s?1000 Megahit', flags: 'hd req'},
	{dName: 'TV1000 Premium', sName: 'TV\\s?1000 Premium', flags: 'hd req'},
	{dName: 'Amedia Premium', sName: 'Amedia Premium', flags: 'hd req'},
	{dName: 'Amedia Hit', sName: 'Amedia Hit|amedia-hit-', flags: 'hd'},
	{dName: 'Paramount Comedy', sName: 'Paramount Comedy', flags: 'hd'},
	{dName: 'HD Life', sName: 'HD Life', flags: 'req'},
	{dName: 'SET', sName: 'SET HD|SET HD \\(SONY\\)', flags: 'req'},
	{dName: 'Кино Премиум', sName: 'Кино\\s?Премиум', flags: 'hd req'},
	{dName: 'HD Кино', sName: 'HD Кино', flags: 'req'},
	{dName: 'HD Кино 2', sName: 'HD Кино 2', flags: ''},

	//Музыка
	{dName: 'MTV Hits', sName: 'MTV Hits|MTV Hits UK', flags: ''},
	{dName: 'MTV Dance', sName: 'MTV Dance', flags: ''},
	{dName: 'Music Box UA', sName: 'Music Box UA', flags: ''},
	{dName: 'М1', sName: 'М1|M1', flags: 'req'},
	{dName: 'М2', sName: 'М2|M2', flags: ''},
	{dName: 'O-TV', sName: 'O-TV', flags: 'req'},
	{dName: 'A-ONE', sName: 'A-ONE', flags: ''},

	//Мультики
	{dName: 'Cartoon Network', sName: 'Cartoon Network', flags: 'req'},
	{dName: 'Disney Channel', sName: 'Disney Channel|Disney Chanel', flags: 'req'},
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
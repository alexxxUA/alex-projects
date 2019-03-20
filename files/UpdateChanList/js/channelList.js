/***
	Available properties for channel:

		dName - used for display name (text representative of channel)
		sName - used like regExp for search channel in playlist
		flags - 'req', 'hd'
***/

var channelList = [
	//Украинские
	{dName: '1+1', sName: '1\\+1', flags: 'req'},
	{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ \\(UA\\)', flags: 'req'},
	{dName: 'Новый канал', sName: 'Новый канал|Новий канал', flags: 'req'},
	{dName: 'ICTV', sName: 'ICTV', flags: 'req'},
	{dName: '2+2', sName: '2\\+2', flags: 'req'},
	{dName: 'ТЕТ', sName: '', flags: 'req'},
	{dName: 'Мега', sName: '', flags: 'req'},
	{dName: 'QTV', sName: 'QTV|OTSE', flags: 'req'},
	{dName: 'К1', sName: '', flags: 'req'},
	{dName: 'Пятница', sName: '', flags: ''},
	{dName: 'KVARTAL TV', sName: '', flags: 'req'},
	{dName: 'Интер', sName: 'Интер|inter-ukraina|Интер\\+', flags: ''},
	{dName: 'Тиса-1', sName: 'Тиса-1|UA:закарпаття', flags: ''},
	{dName: 'К2', sName: '', flags: 'req'},
	{dName: 'ТРК Украина', sName: '', flags: 'req'},

	//Мультики
	{dName: 'ПлюсПлюс', sName: '', flags: ''},
	{dName: 'Пиксель ТВ', sName: 'Пиксель', flags: ''},
	{dName: 'Малятко ТВ', sName: '', flags: ''},
	{dName: 'Карусель', sName: '', flags: ''},
	{dName: 'Детский', sName: 'Детский мир', flags: ''},
	{dName: 'Мультимания', sName: '', flags: ''},
	{dName: 'Nick Jr.', sName: 'Nick jr', flags: 'req'},
	{dName: 'Nickelodeon', sName: '', flags: 'req'},
	{dName: 'Nickelodeon', sName: '', flags: 'hd req'},
	{dName: 'Disney Channel', sName: 'Disney Chanel|Канал Disney', flags: 'req'},
	{dName: 'Cartoon Network', sName: '', flags: 'req'},
	{dName: '2x2', sName: '', flags: 'req'},

	//Разное
	{dName: 'Мама', sName: '', flags: ''},
	{dName: 'Zoom', sName: '', flags: ''},
	{dName: 'Перец', sName: 'Перец|Перец International', flags: ''},
	{dName: 'Че', sName: '', flags: ''},
	{dName: 'СТС', sName: '', flags: ''},
	{dName: 'ТНТ', sName: '', flags: 'req'},
	{dName: 'Парк развлечений', sName: '', flags: ''},
	{dName: 'English Club TV', sName: '', flags: ''},
	
	//Познавательные
	{dName: 'Viasat History', sName: '', flags: 'req'},
	{dName: 'Viasat Nature-History', sName: '', flags: 'hd req'},
	{dName: 'Viasat Explore', sName: 'Viasat Explore|Viasat Explorer', flags: 'req'},
	{dName: 'HD Life', sName: '', flags: 'req'},
	{dName: 'Discovery Investigation', sName: 'Discovery Investigation|Investigation Discovery Europe', flags: ''},
	{dName: 'Discovery World !', sName: 'Discovery World|Discovеry Wоrld|Discovery World \\!', flags: ''},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', flags: 'req'},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', flags: 'hd req'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', flags: 'req'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', flags: 'hd'},
	{dName: 'Discovery Showcase HD', sName: 'Discovery HD Showcase|Discovery Showcase HD', flags: 'req'},
	{dName: 'DTX', sName: '', flags: ''},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'hd req'},
	{dName: 'History Channel', sName: 'History Channel', flags: 'req'},
	{dName: 'History Channel', sName: 'History Channel', flags: 'hd req'},
	{dName: 'TLC', sName: '', flags: ''},
	{dName: 'TLC', sName: '', flags: 'hd'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', flags: 'req'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', flags: 'hd req'},
	{dName: 'Nat Geo Wild', sName: 'Nat Geo Wild|Nаt Geо Wild', flags: 'hd req'},
	{dName: 'Galaxy TV', sName: '', flags: 'req'},
	{dName: 'Наука 2.0', sName: 'Наука 2\\.0', flags: 'req'},
	{dName: 'Моя планета', sName: '', flags: 'req'},
	{dName: 'Техно 24', sName: 'Техно 24|24 Техно', flags: ''},
	{dName: 'НЛО ТВ', sName: 'НЛО ТВ|НЛО TV', flags: ''},
	{dName: 'Travel Channel', sName: '', flags: ''},
	{dName: 'Драйв ТВ', sName: 'Драйв ТВ|Драйв', flags: ''},
	{dName: 'Первый автомобильный', sName: 'Первый автомобильный|Первый автомобильный \\(укр\\)|Первый автомобильный \\(?Украина\\)?', flags: ''},
	{dName: 'Extreme Sports', sName: '', flags: ''},

	//Охота и рыбалка
	{dName: 'Охота и рыбалка', sName: '', flags: ''},
	{dName: 'Охотник и рыболов', sName: '', flags: 'hd'},

	// Кухня
	{dName: 'Еда HD', sName: 'Еда ТВ|Еда|Еда HD', flags: ''},
	{dName: 'Кухня ТВ', sName: '', flags: 'req'},
	{dName: 'Food Network', sName: 'Food Network|Food Netwоrk', flags: ''},
	{dName: 'Food Network', sName: 'Food Netwоrk', flags: 'hd'},
	
	//Фильмы
	{dName: 'ID Xtra', sName: '', flags: 'req'},
	{dName: 'ID Xtra', sName: '', flags: 'hd req'},
	{dName: 'Fox', sName: 'Fox\\.|Fox', flags: 'req'},
	{dName: 'Fox', sName: 'Fox\\.|Fox', flags: 'hd req'},
	{dName: 'Fox Life', sName: '', flags: 'req'},
	{dName: 'Fox Life', sName: '', flags: 'hd req'},
	{dName: 'Paramount Comedy', sName: 'Paramount Comedy|Paramount Comedy HD \\(Россия\\)', flags: ''},
	{dName: 'TV 1000', sName: 'TV 1000', flags: 'req'},
	{dName: 'TV 1000 World Kino', sName: '', flags: 'req'},
	{dName: 'TV 1000 Action East', sName: 'TV 1000 ACTION East', flags: 'req'},
	{dName: 'TV1000 Action', sName: 'TV 1000 Action|TV 1000 Actiоn', flags: 'hd req'},
	{dName: 'ViP Comedy', sName: '', flags: 'hd req'},
	{dName: 'ViP Megahit', sName: '', flags: 'hd req'},
	{dName: 'ViP Premiere', sName: '', flags: 'hd req'},
	{dName: 'Остросюжетное', sName: '', flags: 'hd'},
	{dName: 'КиноПремиум', sName: '', flags: 'hd req'},
	{dName: 'Дом кино Премиум', sName: '', flags: 'hd req'},
	{dName: 'Кинопоказ HD1', sName: 'Кинопоказ 1 HD|Кинопоказ HD1', flags: ''},
	{dName: 'Кинопоказ HD2', sName: 'Кинопоказ 2 HD|Кинопоказ HD2', flags: ''},
	{dName: 'SET', sName: 'SET HD|SET HD \\(SONY\\)', flags: 'req'},
	{dName: 'Amedia Premium', sName: '', flags: 'hd req'},
	{dName: 'Amedia Hit', sName: '', flags: 'hd'},
	{dName: 'Enter Film', sName: '', flags: ''},
	{dName: 'Кино ТВ', sName: '', flags: ''},
	{dName: 'Кинокомедия', sName: '', flags: 'req'},
	{dName: 'Кинопоказ', sName: '', flags: ''},

	// Новостные
	{dName: '112 Украина', sName: '', flags: 'hd'},
	{dName: '5 канал (Украина)', sName: '', flags: ''},
	{dName: '24 Украина', sName: '', flags: ''},
	{dName: 'Еспресо ТВ', sName: '', flags: ''},

	//Музыка
	{dName: 'MTV Hits', sName: 'MTV Hits|MTV Hits UK', flags: ''},
	{dName: 'MTV Dance', sName: '', flags: ''},
	{dName: 'Music Box UA', sName: '', flags: ''},
	{dName: 'М1', sName: 'М1|M1', flags: 'req'},
	{dName: 'М2', sName: 'М2|M2', flags: ''},
	{dName: 'O-TV', sName: '', flags: 'req'},
	{dName: 'A-ONE', sName: '', flags: ''}
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

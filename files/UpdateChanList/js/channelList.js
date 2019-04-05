/***
	Available properties for channel:

		dName - used for display name (text representative of channel)
		sName - used like regExp for search channel in playlist
		flags - 'req', 'hd'
***/

var channelList = [
	//Украинские
	{dName: '1+1', sName: '1\\+1', pName: 'Канал 1+1', flags: 'req'},
	{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ \\(UA\\)', flags: 'req'},
	{dName: 'Новый канал', sName: 'Новый канал|Новий канал', pName: 'Новый канал',flags: 'req'},
	{dName: 'ICTV', sName: 'ICTV', pName: 'ICTV (Украина)', flags: 'req'},
	{dName: '2+2', sName: '2\\+2', pName: '2+2 (кино)', flags: 'req'},
	{dName: 'ТЕТ', sName: '', flags: 'req'},
	{dName: 'Мега', sName: '', flags: 'req'},
	{dName: 'ОЦЕ', sName: 'QTV|OTSE|ОЦЕ', pName: 'ОЦЕ', flags: 'req'},
	{dName: 'К1', sName: '', flags: 'req'},
	{dName: 'Пятница', sName: '', flags: ''},
	{dName: 'KVARTAL TV', sName: '', pName: 'Квартал ТВ', flags: 'req'},
	{dName: 'Интер', sName: 'Интер|inter-ukraina|Интер\\+', flags: ''},
	{dName: 'UA ЗАКАРПАТТЯ', sName: 'Тиса-1|UA:закарпаття', pName: 'UA: ЗАКАРПАТТЯ', flags: ''},
	{dName: 'К2', sName: '', flags: 'req'},
	{dName: 'ТРК Украина', sName: '', flags: 'req'},

	//Мультики
	{dName: 'ПлюсПлюс', sName: '', flags: ''},
	{dName: 'Пиксель ТВ', sName: 'Пиксель', flags: ''},
	{dName: 'Малятко ТВ', sName: '', pName: 'Малятко ТВ', flags: ''},
	{dName: 'Карусель', sName: '', flags: ''},
	{dName: 'Детский', sName: 'Детский мир', pName: 'Детский мир', flags: ''},
	{dName: 'Мультимания', sName: '', flags: ''},
	{dName: 'Nick Jr.', sName: 'Nick jr', pName: 'Nick Jr', flags: 'req'},
	{dName: 'Nickelodeon', sName: '', flags: 'req'},
	{dName: 'Nickelodeon', sName: '', pName: 'Nickelodeon HD', flags: 'hd req'},
	{dName: 'Disney Channel', sName: 'Disney Chanel|Канал Disney', pName: 'Disney', flags: 'req'},
	{dName: 'Cartoon Network', sName: '', pName: 'Cartoon Network', flags: 'req'},
	{dName: '2X2', sName: '', flags: 'req'},

	//Разное
	{dName: 'Мама', sName: '', flags: ''},
	{dName: 'ZOOM', sName: '', flags: ''},
	{dName: 'Перец', sName: 'Перец|Перец International', flags: ''},
	{dName: 'Че', sName: '', flags: ''},
	{dName: 'СТС', sName: '', flags: ''},
	{dName: 'ТНТ', sName: '', flags: 'req'},
	{dName: 'Парк развлечений', sName: '', flags: ''},
	{dName: 'English Club TV', sName: '', pName: 'English Club TV', flags: ''},
	
	//Познавательные
	{dName: 'Viasat History', sName: '', pName: 'Viasat History', flags: 'req'},
	{dName: 'Viasat Nature-History', sName: '', pName: 'Viasat Nature/History HD', flags: 'hd req'},
	{dName: 'Viasat Explore', sName: 'Viasat Explore|Viasat Explorer', pName: 'Viasat Explore', flags: 'req'},
	{dName: 'HD Life', sName: '', pName: 'HD Life', flags: 'req'},
	{dName: 'Discovery Investigation', sName: 'Discovery Investigation|Investigation Discovery Europe', flags: ''},
	{dName: 'Discovery World !', sName: 'Discovery World|Discovеry Wоrld|Discovery World \\!', flags: ''},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', pName: 'Discovery Science', flags: 'req'},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', flags: 'hd req'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', pName: 'Discovery Channel', flags: 'req'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', pName: 'Discovery Channel HD', flags: 'hd'},
	{dName: 'Discovery Showcase HD', sName: 'Discovery HD Showcase|Discovery Showcase HD', flags: 'req'},
	{dName: 'DTX', sName: '', flags: ''},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', flags: 'req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', pName: 'National Geographic HD', flags: 'hd req'},
	{dName: 'History Channel', sName: 'History Channel', pName: 'History HD', flags: 'req'},
	{dName: 'History Channel', sName: 'History Channel', pName: 'History HD', flags: 'hd req'},
	{dName: 'TLC', sName: '', flags: ''},
	{dName: 'TLC', sName: '', pName: 'TLC HD', flags: 'hd'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', pName: 'Animal Planet', flags: 'req'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', pName: 'Animal Planet HD', flags: 'hd req'},
	{dName: 'Nat Geo Wild', sName: 'Nat Geo Wild|Nаt Geо Wild', pName: 'Nat Geo Wild HD', flags: 'hd req'},
	{dName: 'Galaxy TV', sName: '', flags: 'req'},
	{dName: 'Наука 2.0', sName: 'Наука 2\\.0', pName: 'Наука 2.0', flags: 'req'},
	{dName: 'Моя планета', sName: '', pName: 'Моя планета', flags: 'req'},
	{dName: 'Техно 24', sName: 'Техно 24|24 Техно', flags: ''},
	{dName: 'НЛО ТВ', sName: 'НЛО ТВ|НЛО TV', pName: 'НЛО TV', flags: ''},
	{dName: 'Travel Channel', sName: '', pName: 'Travel Channel', flags: ''},
	{dName: 'Travel Channel', sName: '', pName: 'Travel Channel HD', flags: 'hd'},
	{dName: 'Драйв ТВ', sName: 'Драйв ТВ|Драйв', pName:'Драйв ТВ', flags: ''},
	{dName: 'Первый автомобильный', sName: 'Первый автомобильный|Первый автомобильный \\(укр\\)|Первый автомобильный \\(?Украина\\)?', flags: ''},
	{dName: 'Extreme Sports', sName: '', pName: 'Extreme Sports', flags: ''},

	//Охота и рыбалка
	{dName: 'Охота и рыбалка', sName: '', flags: ''},
	{dName: 'Охотник и рыболов', sName: '', pName: 'Охотник и рыболов HD', flags: 'hd'},

	// Кухня
	{dName: 'Еда HD', sName: 'Еда ТВ|Еда|Еда HD', flags: ''},
	{dName: 'Кухня ТВ', sName: '', pName: 'Кухня ТВ', flags: 'req'},
	{dName: 'Food Network', sName: 'Food Network|Food Netwоrk', pName: 'Food Network', flags: ''},
	{dName: 'Food Network', sName: 'Food Netwоrk', pName: 'Food Network HD', flags: 'hd'},
	
	//Фильмы
	{dName: 'ID Xtra', sName: '', pName: 'ID Xtra', flags: 'req'},
	{dName: 'ID Xtra', sName: '', pName: 'ID Xtra HD', flags: 'hd req'},
	{dName: 'Fox', sName: 'Fox\\.|Fox', flags: 'req'},
	{dName: 'Fox', sName: 'Fox\\.|Fox', pName: 'Fox HD', flags: 'hd req'},
	{dName: 'Fox Life', sName: '', pName: 'Fox Life', flags: 'req'},
	{dName: 'Fox Life', sName: '', pName: 'Fox Life HD', flags: 'hd req'},
	{dName: 'Paramount Comedy', sName: 'Paramount Comedy|Paramount Comedy HD \\(Россия\\)|Paramount Comedy Russia', pName: 'Paramount Comedy Russia', flags: ''},
	{dName: 'TV 1000', sName: 'TV 1000', pName: 'TV 1000', flags: 'req'},
	{dName: 'TV 1000 World Kino', sName: '', pName: 'TV1000 World Kino', flags: 'req'},
	{dName: 'TV 1000 Action East', sName: 'TV 1000 ACTION East', pName: 'TV1000 Action', flags: 'req'},
	{dName: 'TV1000 Action', sName: 'TV 1000 Action|TV 1000 Actiоn', pName: 'TV1000 Action', flags: 'hd req'},
	{dName: 'ViP Comedy', sName: '', pName: 'ViP Comedy', flags: 'hd req'},
	{dName: 'ViP Megahit', sName: '', pName: 'ViP Megahit', flags: 'hd req'},
	{dName: 'ViP Premiere', sName: '', pName: 'ViP Premiere', flags: 'hd req'},
	{dName: 'Остросюжетное', sName: '', pName: 'Остросюжетное HD', flags: 'hd'},
	{dName: 'КиноПремиум', sName: '', flags: 'hd req'},
	{dName: 'Дом кино Премиум', sName: '', pName: 'Дом Кино Премиум HD', flags: 'hd req'},
	{dName: 'Кинопоказ HD1', sName: 'Кинопоказ 1 HD|Кинопоказ HD1|Кинопоказ HD-1', pName: 'Кинопоказ HD-1', flags: ''},
	{dName: 'Кинопоказ HD2', sName: 'Кинопоказ 2 HD|Кинопоказ HD2|Кинопоказ HD-2', pName: 'Кинопоказ HD-2', flags: ''},
	{dName: 'SET', sName: 'SET HD|SET HD \\(SONY\\)', flags: 'req'},
	{dName: 'Amedia Premium', sName: '', pName: 'Amedia Premium HD', flags: 'hd req'},
	{dName: 'Amedia Hit', sName: '', pName: 'AMEDIA HIT', flags: ''},
	{dName: 'Amedia Hit', sName: '', pName: 'AMEDIA HIT', flags: 'hd'},
	{dName: 'Enter Film', sName: '', flags: ''},
	{dName: 'Кино ТВ', sName: '', pName: 'Кино ТВ', flags: ''},
	{dName: 'Кинокомедия', sName: '', pName: 'КИНОКОМЕДИЯ', flags: 'req'},
	{dName: 'Кинопоказ', sName: '', flags: ''},

	// Новостные
	{dName: '112 Украина', sName: '', flags: 'hd'},
	{dName: '5 канал (Украина)', sName: '5 канал \\(Украина\\)|5 канал', pName: '5 канал', flags: ''},
	{dName: '24 Украина', sName: '', flags: ''},
	{dName: 'Еспресо ТВ', sName: '', flags: ''},

	//Музыка
	{dName: 'MTV Hits', sName: 'MTV Hits|MTV Hits UK', pName: 'MTV Hits', flags: ''},
	{dName: 'MTV Dance', sName: '', pName: 'MTV Dance', flags: ''},
	{dName: 'Music Box UA', sName: '', pName: 'Music Box UA', flags: ''},
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

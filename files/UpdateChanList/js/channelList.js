/***
	Available properties for channel:

		dName - used for display name (text representative of channel)
		sName - used like regExp for search channel in playlist
		flags - 'req', 'hd'
***/

var channelList = [
	//Украинские
	{dName: '1+1', sName: '1\\+1', tvgName: 'Канал 1+1', flags: 'req hd'},
	{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ \\(UA\\)', flags: 'req'},
	{dName: 'Новый канал', sName: 'Новый канал|Новий канал', tvgName: 'Новый канал',flags: 'req'},
	{dName: 'ICTV', sName: 'ICTV', tvgName: 'ICTV (Украина)', flags: 'req'},
	{dName: '2+2', sName: '2\\+2', tvgName: '2+2 (кино)', flags: 'req'},
	{dName: 'ТЕТ', sName: 'TET', flags: 'req'},
	{dName: 'Сонце', sName: '', flags: 'req'},
	{dName: 'Україна', sName: 'Україна|ТРК Украина|Украина', tvgName: 'Україна', flags: 'req'},
	{dName: 'UA: Перший', sName: 'UA\\: Перший|UA\\: Перший HD', tvgName: 'UA:Перший', flags: 'req'},
	{dName: 'Мега', sName: '', tvgName: 'ТК Мега', flags: 'req'},
	{dName: 'НЛО ТВ', sName: 'НЛО ТВ|НЛО TV|НЛО|NLO TV1', tvgName: 'НЛО-ТВ', flags: ''},
	{dName: 'ОЦЕ', sName: 'QTV|OTSE|ОЦЕ', tvgName: 'ОЦЕ', flags: 'req'},
	{dName: 'К1', sName: 'К1|K1', flags: 'req'},
	{dName: 'Пятница', sName: '', flags: ''},
	{dName: 'Квартал ТВ', sName: 'Квартал|Квартал TV|Квартал ТВ|KVARTAL TV', flags: 'req'},
	{dName: 'Интер', sName: 'Интер|inter-ukraina|Интер\\+|Інтер|Iнтер', flags: ''},
	{dName: 'UA ЗАКАРПАТТЯ', sName: 'Тиса-1|UA: закарпаття', tvgName: 'UA: ЗАКАРПАТТЯ', flags: ''},
	{dName: 'К2', sName: 'K2', flags: 'req'},

	//Мультики
	{dName: 'ПлюсПлюс', sName: 'Плюс Плюс', flags: ''},
	{dName: 'Niki Junior', sName: 'Niki Junior|Niki Junior HD', flags: ''},
	{dName: 'Пиксель ТВ', sName: 'Пиксель', tvgName: 'Пиксель', flags: ''},
	{dName: 'Малятко ТВ', sName: '', flags: ''},
	{dName: 'Карусель', sName: '', flags: ''},
	{dName: 'Детский', sName: 'Детский мир', tvgName: 'Детский мир', flags: ''},
	{dName: 'Мультимания', sName: 'Мультимания|Мульт', flags: ''},
	{dName: 'Nick Jr.', sName: 'Nick jr|Nick Jr\\.', tvgName: 'Nick Jr', flags: 'req'},
	{dName: 'Nickelodeon', sName: '', flags: 'req'},
	{dName: 'Nickelodeon EN', sName: '', tvgName: 'Nickelodeon', flags: 'req'},
	{dName: 'Nickelodeon', sName: '', tvgName: 'Nickelodeon HD', flags: 'hd req'},
	{dName: 'Disney Channel', sName: 'Disney Chanel|Канал Disney|Disney канал|Disney', flags: 'req'},
	{dName: 'Disney EN', sName: 'Disney XD', tvgName: 'Disney Channel', flags: 'req'},
	{dName: 'Cartoon Network', sName: '', tvgName: 'Cartoon Network', flags: 'req'},
	{dName: '2X2', sName: '', tvgName: 'Канал 2x2', flags: 'req'},

	//Разное
	{dName: 'Мама', sName: '', flags: ''},
	{dName: 'ZOOM', sName: '', flags: ''},
	{dName: 'Перец', sName: 'Перец|Перец International|Перец инт\\.', flags: ''},
	{dName: 'Че', sName: '', flags: ''},
	{dName: 'СТС', sName: '', flags: ''},
	{dName: 'ТНТ', sName: '', flags: 'req'},
	{dName: 'Парк развлечений', sName: '', flags: ''},
	{dName: 'English Club TV', sName: 'English Club TV|English Club|English club HD|English club TV HD', tvgName: 'English Club TV'},
	
	//Познавательные
	{dName: 'Viasat Nature', sName: '', flags: 'req'},
	{dName: 'Viasat History', sName: '', tvgName: 'Viasat History', flags: 'req'},
	{dName: 'Viasat Nature-History', sName: 'Viasat Nature-History|Viasat Nature/History', tvgName: 'Viasat Nature/History HD', flags: 'hd req'},
	{dName: 'Viasat Explore', sName: 'Viasat Explore|Viasat Explorer', tvgName: 'Viasat Explore', flags: 'req'},
	{dName: 'HD Life', sName: '', tvgName: 'HD Life', flags: 'req'},
	{dName: 'Discovery Investigation', sName: 'Discovery Investigation|Investigation Discovery Europe|Investigation Discovery', tvgName: 'ID Investigation Discovery', flags: ''},
	{dName: 'Discovery World !', sName: 'Discovery World|Discovеry Wоrld|Discovery World \\!', flags: ''},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', tvgName: 'Discovery Science', flags: 'req'},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', tvgName: 'Discovery Science', flags: 'hd req'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', tvgName: 'Discovery Channel', flags: 'req'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', tvgName: 'Discovery Channel HD', flags: 'hd'},
	{dName: 'Discovery Showcase HD', sName: 'Discovery HD Showcase|Discovery Showcase HD', tvgName: 'Discovery HD Showcase', flags: 'req'},
	{dName: 'DTX', sName: '', flags: ''},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic|nat geographic', tvgName: 'nat geographic', flags: 'req'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', tvgName: 'National Geographic HD', flags: 'hd req'},
	{dName: 'History Channel', sName: 'History Channel|History|History Russia', tvgName: 'History HD', flags: 'req'},
	{dName: 'History Channel', sName: 'History Channel|History', tvgName: 'History HD', flags: 'hd req'},
	{dName: 'TLC', sName: '', flags: ''},
	{dName: 'TLC', sName: '', tvgName: 'TLC HD', flags: 'hd'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', tvgName: 'Animal Planet', flags: 'req'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', tvgName: 'Animal Planet HD', flags: 'hd req'},
	{dName: 'Nat Geo Wild', sName: 'Nat Geo Wild|Nаt Geо Wild', tvgName: 'Nat Geo Wild HD', flags: 'hd req'},
	{dName: 'Galaxy TV', sName: '', flags: 'req'},
	{dName: 'Наука 2.0', sName: 'Наука 2\\.0', tvgName: 'Наука 2.0', flags: 'req'},
	{dName: 'Моя планета', sName: '', tvgName: 'Моя планета', flags: 'req'},
	{dName: 'Техно 24', sName: 'Техно 24|24 Техно', flags: ''},
	{dName: 'Travel Channel', sName: '', tvgName: 'Travel Channel', flags: ''},
	{dName: 'Travel Channel HD', sName: 'Travel Channel HD|Travel Channel H'},
	{dName: 'FAST&FUN BOX', sName: '', flags: 'hd'},
	{dName: 'Драйв ТВ', sName: 'Драйв ТВ|Драйв', tvgName:'Драйв ТВ', flags: ''},
	{dName: 'Первый автомобильный', sName: 'Первый автомобильный|Первый автомобильный \\(укр\\)|Первый автомобильный \\(?Украина\\)?', flags: ''},
	{dName: 'Extreme Sports', sName: 'Extreme Sports|Extreme Sport', tvgName: 'Extreme Sports', flags: ''},
	{dName: 'Viasat Sport', sName: '', flags: ''},
	{dName: 'Eurosport 1', sName: '', flags: 'hd'},

	//Охота и рыбалка
	{dName: 'Охота и рыбалка', sName: '', flags: ''},
	{dName: 'Охотник и рыболов', sName: '', tvgName: 'Охотник и рыболов HD', flags: 'hd'},

	// Кухня
	{dName: 'Еда HD', sName: 'Еда ТВ|Еда|Еда HD|ЕДА Премиум', flags: ''},
	{dName: 'Кухня ТВ', sName: '', tvgName: 'Кухня ТВ', flags: 'req'},
	{dName: 'Food Network', sName: 'Food Network|Food Netwоrk', tvgName: 'Food Network', flags: ''},
	{dName: 'Food Network', sName: 'Food Netwоrk|Food Network', tvgName: 'Food Network HD', flags: 'hd'},
	
	//Фильмы
	{dName: 'ID Xtra', sName: '', tvgName: 'ID Xtra', flags: 'req'},
	{dName: 'ID Xtra', sName: '', tvgName: 'ID Xtra HD', flags: 'hd req'},
	{dName: 'Fox', sName: 'Fox\\.|Fox|Fox Russia', flags: 'req'},
	{dName: 'Fox', sName: 'Fox\\.|Fox|Fox Russia', tvgName: 'Fox HD', flags: 'hd req'},
	{dName: 'Fox Life', sName: '', tvgName: 'Fox Life', flags: 'req'},
	{dName: 'Fox Life', sName: '', tvgName: 'Fox Life HD', flags: 'hd req'},
	{dName: 'Paramount Comedy', sName: 'Paramount Comedy|Paramount Comedy HD \\(Россия\\)|Paramount Comedy Russia', tvgName: 'Paramount Comedy Russia', flags: ''},
	{dName: 'TV 1000', sName: 'TV 1000', tvgName: 'TV 1000', flags: 'req'},
	{dName: 'TV 1000', sName: 'TV 1000', tvgName: 'TV 1000', flags: 'req hd'},
	{dName: 'TV 1000 World Kino', sName: '', tvgName: 'TV1000 World Kino', flags: 'req'},
	{dName: 'TV 1000 Action East', sName: 'TV 1000 ACTION East|TV 1000 Action', tvgName: 'TV1000 Action', flags: 'req'},
	{dName: 'TV1000 Action', sName: 'TV 1000 Action|TV 1000 Actiоn', tvgName: 'TV1000 Action', flags: 'hd req'},
	{dName: 'ViP Comedy', sName: '', tvgName: 'VIP Comedy', flags: 'req'},
	{dName: 'ViP Megahit', sName: '', tvgName: 'VIP Megahit', flags: 'req'},
	{dName: 'ViP Premiere', sName: '', tvgName: 'VIP Premiere', flags: 'req'},
	{dName: 'Кинокомедия', sName: '', tvgName: 'КИНОКОМЕДИЯ', flags: 'req'},
	{dName: 'Комедийное', sName: '', flags: 'hd'},
	{dName: 'Кинохит', sName: '', tvgName: 'КИНОХИТ', flags: 'req'},
	{dName: 'Остросюжетное', sName: '', tvgName: 'Остросюжетное HD', flags: 'hd'},
	{dName: 'КиноПремиум', sName: '', flags: 'hd req'},
	{dName: 'Дом кино Премиум', sName: '', tvgName: 'Дом Кино Премиум HD', flags: 'hd req'},
	{dName: 'Кинопоказ HD1', sName: 'Кинопоказ 1 HD|Кинопоказ HD1|Кинопоказ HD-1', tvgName: 'Кинопоказ HD-1', flags: ''},
	{dName: 'Кинопоказ HD2', sName: 'Кинопоказ 2 HD|Кинопоказ HD2|Кинопоказ HD-2', tvgName: 'Кинопоказ HD-2', flags: ''},
	{dName: 'SET', sName: 'SET HD|SET HD \\(SONY\\)|Sony Set|Sony Entertainment Television', tvgName: 'Sony Entertainment Television', flags: 'req'},
	{dName: 'Amedia Premium', sName: '', tvgName: 'Amedia Premium HD', flags: 'hd req'},
	{dName: 'Amedia Hit', sName: '', tvgName: 'AMEDIA HIT', flags: ''},
	{dName: 'Amedia Hit', sName: '', tvgName: 'AMEDIA HIT', flags: 'hd'},
	{dName: 'Enter Film', sName: 'Enter Film|Enter-фильм|Enter-фільм', tvgName: 'Enter-фільм', flags: ''},
	{dName: 'Кино ТВ', sName: '', tvgName: 'Кино ТВ', flags: ''},
	{dName: 'Кино ТВ', sName: '', tvgName: 'Кино ТВ', flags: 'hd'},
	{dName: 'Кинопоказ', sName: '', flags: ''},
	{dName: 'Filmbox Arthouse', sName: '', flags: ''},

	// Новостные
	{dName: '112 Украина', sName: '112 Украина HD|112 Україна HD|112 Україна', tvgName: '112 Україна', flags: ''},
	{dName: '5 канал (Украина)', sName: '5 канал \\(Украина\\)|5 канал', tvgName: '5 канал', flags: ''},
	{dName: '24 Украина', sName: '24 Канал', tvgName: '24 Канал', flags: ''},
	{dName: 'Еспресо ТВ', sName: 'Еспресо ТВ|Еспресо\\.tv|Еспресо|Eспресо TV|Эспресо ТВ HD', tvgName: 'Eспресо TV', flags: ''},

	//Музыка
	{dName: 'MTV Hits', sName: 'MTV Hits|MTV Hits UK', tvgName: 'MTV Hits', flags: ''},
	{dName: 'MTV Dance', sName: '', tvgName: 'MTV Dance', flags: ''},
	{dName: 'Music Box UA', sName: 'Music Box UA|Music Box UA HD', tvgName: 'Music Box UA HD', flags: ''},
	{dName: 'М1', sName: 'М1|M1', tvgName: 'M1', flags: 'req'},
	{dName: 'М2', sName: 'М2|M2', tvgName: 'M2', flags: ''},
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

/***
	Available properties for channel:

		dName - used for display name (text representative of channel)
		sName - used like regExp for search channel in playlist
		flags - 'req', 'hd'
		group - channel group
		tvgName - name of channel for EPG
		tvgId - id of the channel for EPG
***/

var channelList = [
	//Украинские
	{dName: '1+1', sName: '1\\+1', flags: 'req hd', group: 'UA'},
	{dName: '1+1 International', sName: '1\\+1 International', group: 'UA'},
	{dName: 'СТБ', sName: 'СТБ|СТБ Украина|СТБ \\(UA\\)', flags: 'req', group: 'UA'},
	{dName: 'Новый канал', sName: 'Новый канал|Новий канал', tvgName: 'Новый канал',flags: 'req', group: 'UA'},
	{dName: 'ICTV', sName: 'ICTV', tvgName: 'ICTV (Украина)', flags: 'req', group: 'UA'},
	{dName: '2+2', sName: '2\\+2', tvgName: '2+2 (кино)', flags: 'req', group: 'UA'},
	{dName: 'ТЕТ', sName: 'TET', flags: 'req', group: 'UA'},
	{dName: 'Сонце', flags: 'req', group: 'UA'},
	{dName: 'Бігуді', group: 'UA'},
	{dName: 'Интер', sName: 'Интер|inter-ukraina|Интер\\+|Інтер|Iнтер', group: 'UA'},
	{dName: 'К1', sName: 'К1|K1', flags: 'req', group: 'UA'},
	{dName: 'Пятница', group: 'UA'},
	{dName: 'Квартал ТВ', sName: 'Квартал|Квартал TV|Квартал ТВ|KVARTAL TV', flags: 'req', group: 'UA'},
	{dName: 'Мега', tvgName: 'ТК Мега', flags: 'req', group: 'UA'},
	{dName: 'НЛО ТВ', sName: 'НЛО ТВ|НЛО TV|НЛО|NLO TV1', tvgName: 'НЛО-ТВ', group: 'UA'},
	{dName: 'Болт', flags: 'hd', group: 'UA'},
	{dName: 'Nauka', group: 'UA'},
	{dName: 'Україна', sName: 'Україна|ТРК Украина|Украина', tvgName: 'Україна', flags: 'req', group: 'UA'},
	{dName: 'Перший', flags: 'hd', group: 'UA'},
	{dName: 'UA ЗАКАРПАТТЯ', sName: 'Тиса-1|UA: закарпаття', tvgName: 'UA: ЗАКАРПАТТЯ', group: 'UA'},
	{dName: 'К2', sName: 'K2', flags: 'req', group: 'UA'},

	//Мультики
	{dName: 'Jojko', flags: 'm3', group: 'Дитячі'},
	{dName: 'ПлюсПлюс', sName: 'Плюс Плюс', group: 'Дитячі'},
	{dName: 'Niki Junior', sName: 'Niki Junior|Niki Junior HD', group: 'Дитячі'},
	{dName: 'NIKI Kids', flags: 'hd', group: 'Дитячі'},
	{dName: 'Lale', flags: 'hd', group: 'Дитячі'},
	{dName: 'Пиксель ТВ', sName: 'Пиксель', tvgName: 'Пиксель', group: 'Дитячі'},
	{dName: 'Малятко ТВ', group: 'Дитячі'},
	{dName: 'Nick Jr.', sName: 'Nick jr|Nick Jr\\.', tvgName: 'Nick Jr', flags: 'req', group: 'Дитячі'},
	{dName: 'Nickelodeon', flags: 'req', group: 'Дитячі'},
	{dName: 'Nickelodeon', tvgName: 'Nickelodeon HD', flags: 'hd req', group: 'Дитячі'},
	{dName: 'Disney Channel', sName: 'Disney Chanel|Канал Disney|Disney канал|Disney', flags: 'req', group: 'Дитячі'},
	{dName: 'СТС Kids', flags: 'hd', group: 'Дитячі'},
	{dName: 'Карусель', group: 'Дитячі'},
	{dName: 'Детский', sName: 'Детский мир', tvgName: 'Детский мир', group: 'Дитячі'},
	{dName: 'Мультимания', sName: 'Мультимания|Мульт', group: 'Дитячі'},
	// {dName: 'Cartoon Network', tvgName: 'Cartoon Network', flags: 'req', group: 'Дитячі'},
	// {dName: '2X2', tvgName: 'Канал 2x2', flags: 'req', group: 'Дитячі'},

	//Фильмы
	{dName: 'TV 1000', sName: 'TV 1000', tvgName: 'TV 1000', flags: 'req', group: 'Фільми'},
	{dName: 'TV 1000', sName: 'TV 1000', tvgName: 'TV 1000', flags: 'req hd', group: 'Фільми'},
	{dName: 'TV 1000 World Kino', tvgName: 'TV1000 World Kino', flags: 'req', group: 'Фільми'},
	{dName: 'TV 1000 Action East', sName: 'TV 1000 ACTION East|TV 1000 Action', tvgName: 'TV1000 Action', flags: 'req', group: 'Фільми'},
	{dName: 'TV1000 Action', sName: 'TV 1000 Action|TV 1000 Actiоn', tvgName: 'TV1000 Action', flags: 'hd req', group: 'Фільми'},
	{dName: 'ViP Megahit', tvgName: 'VIP Megahit', flags: 'req', group: 'Фільми'},
	{dName: 'ViP Premiere', tvgName: 'VIP Premiere', flags: 'req', group: 'Фільми'},
	{dName: 'ViP Comedy', tvgName: 'VIP Comedy', flags: 'req', group: 'Фільми'},
	{dName: 'Комедийное', flags: 'hd', group: 'Фільми'},
	{dName: 'Paramount Comedy', flags: 'hd', group: 'Фільми'},
	{dName: 'Кино ТВ', tvgName: 'Кино ТВ', flags: 'hd', group: 'Фільми'},
	{dName: 'Ultra HD Cinema', flags: '', group: 'Фільми'},
	{dName: 'Кино UHD', flags: '', group: 'Фільми'},
	{dName: 'Сериал UHD', flags: '', group: 'Фільми'},
	{dName: 'Paramount Channel', flags: '', group: 'Фільми'},
	{dName: 'Кинохит', tvgName: 'КИНОХИТ', flags: 'req', group: 'Фільми'},
	{dName: 'Кинопремьера', flags: 'hd', group: 'Фільми'},
	{dName: 'Киномикс', flags: '', group: 'Фільми'},
	{dName: 'Киносемья', flags: 'hd', group: 'Фільми'},
	{dName: 'Остросюжетное', tvgName: 'Остросюжетное HD', flags: 'hd', group: 'Фільми'},
	{dName: 'Еврокино', flags: 'hd', group: 'Фільми'},
	{dName: 'Дом кино Премиум', tvgName: 'Дом Кино Премиум HD', flags: 'hd req', group: 'Фільми'},
	{dName: 'Sony Channel', sName: 'SET HD|SET HD \\(SONY\\)|Sony Set|Sony Entertainment Television|Sony Channel', flags: 'req', group: 'Фільми'},
	{dName: 'Sony Sci-Fi', group: 'Фільми'},
	{dName: 'Sony Turbo', group: 'Фільми'},
	{dName: 'Премиальное', flags: 'hd', group: 'Фільми'},
	{dName: 'Hollywood', group: 'Фільми'},
	{dName: 'Amedia Premium', tvgName: 'Amedia Premium HD', flags: 'hd req', group: 'Фільми'},
	{dName: 'Amedia Hit', tvgName: 'AMEDIA HIT', group: 'Фільми'},
	{dName: 'Amedia Hit', tvgName: 'AMEDIA HIT', flags: 'hd', group: 'Фільми'},
	{dName: 'Amedia 1', group: 'Фільми'},
	{dName: 'Amedia 2', group: 'Фільми'},
	{dName: 'Enter Film', sName: 'Enter Film|Enter-фильм|Enter-фільм', tvgName: 'Enter-фільм', group: 'Фільми'},
	{dName: 'Star Cinema', flags: 'hd', group: 'Фільми'},
	{dName: 'Star Family', flags: 'hd', group: 'Фільми'},
	{dName: 'ID Xtra', tvgName: 'ID Xtra', flags: 'req', group: 'Фільми'},
	{dName: 'ID Xtra', tvgName: 'ID Xtra HD', flags: 'hd req', group: 'Фільми'},
	{dName: 'Fox', sName: 'Fox\\.|Fox|Fox Russia', flags: 'req', group: 'Фільми'},
	{dName: 'Fox', sName: 'Fox\\.|Fox|Fox Russia', tvgName: 'Fox HD', flags: 'hd req', group: 'Фільми'},
	{dName: 'Fox Life', tvgName: 'Fox Life', flags: 'req', group: 'Фільми'},
	{dName: 'Fox Life', tvgName: 'Fox Life HD', flags: 'hd req', group: 'Фільми'},

	//Познавательные
	{dName: 'TLC', tvgName: 'TLC HD', flags: 'hd', group: 'Пізнавальні'},
	{dName: 'English Club TV', sName: 'English Club TV|English Club|English club HD|English club TV HD', tvgName: 'English Club TV', group: 'Пізнавальні'},
	{dName: 'Viasat Nature', flags: 'req', group: 'Пізнавальні'},
	{dName: 'Viasat History', tvgName: 'Viasat History', flags: 'req', group: 'Пізнавальні'},
	{dName: 'Viasat Nature-History', sName: 'Viasat Nature-History|Viasat Nature/History', tvgName: 'Viasat Nature/History HD', flags: 'hd req', group: 'Пізнавальні'},
	{dName: 'Viasat Explore', sName: 'Viasat Explore|Viasat Explorer', tvgName: 'Viasat Explore', flags: 'req', group: 'Пізнавальні'},
	{dName: 'HDL', group: 'Пізнавальні'},
	{dName: 'Discovery Investigation', sName: 'Discovery Investigation|Investigation Discovery Europe|Investigation Discovery', tvgName: 'ID Investigation Discovery', group: 'Пізнавальні'},
	{dName: 'Discovery World !', sName: 'Discovery World|Discovеry Wоrld|Discovery World \\!', group: 'Пізнавальні'},
	{dName: 'Discovery Science', sName: 'Discovery Science|Discovеry Sciеnce|Discovery  Science', tvgName: 'Discovery Science', flags: 'hd req', group: 'Пізнавальні'},
	{dName: 'Discovery Channel', sName: 'Discovery Channel|Discovеry Channеl', tvgName: 'Discovery Channel HD', flags: 'hd', group: 'Пізнавальні'},
	{dName: 'Discovery Showcase HD', sName: 'Discovery HD Showcase|Discovery Showcase HD', tvgName: 'Discovery HD Showcase', flags: 'req', group: 'Пізнавальні'},
	{dName: 'DTX', group: 'Пізнавальні'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic|nat geographic', tvgName: 'nat geographic', flags: 'req', group: 'Пізнавальні'},
	{dName: 'National Geographic', sName: 'National Geographic Channel|National Geographic|Nationаl Geogrаphic', tvgName: 'National Geographic HD', flags: 'hd req', group: 'Пізнавальні'},
	{dName: 'History Channel', sName: 'History Channel|History', tvgName: 'History HD', flags: 'hd req', group: 'Пізнавальні'},
	{dName: 'Animal Planet', sName: 'Animal Planet|Animаl Planеt', tvgName: 'Animal Planet HD', flags: 'hd req', group: 'Пізнавальні'},
	{dName: 'Nat Geo Wild', sName: 'Nat Geo Wild|Nаt Geо Wild', tvgName: 'Nat Geo Wild HD', flags: 'hd req', group: 'Пізнавальні'},
	{dName: 'Galaxy TV', flags: 'req', group: 'Пізнавальні'},
	{dName: 'Наука', group: 'Пізнавальні'},
	{dName: 'Моя планета', tvgName: 'Моя планета', flags: 'req hd', group: 'Пізнавальні'},
	{dName: 'Техно 24', sName: 'Техно 24|24 Техно', group: 'Пізнавальні'},
	{dName: 'Travel\\+Adventure', flags: 'hd', group: 'Пізнавальні'},
	{dName: 'HD Rex', group: 'Пізнавальні'},
	{dName: 'Вопросы и ответы', group: 'Пізнавальні'},
	{dName: 'Драйв ТВ', sName: 'Драйв ТВ|Драйв', tvgName:'Драйв ТВ', group: 'Пізнавальні'},
	{dName: 'Первый автомобильный', sName: 'Первый автомобильный|Первый автомобильный \\(укр\\)|Первый автомобильный \\(?Украина\\)?', group: 'Пізнавальні'},
	{dName: 'Extreme Sports', sName: 'Extreme Sports|Extreme Sport', tvgName: 'Extreme Sports', group: 'Пізнавальні'},
	{dName: 'Viasat Sport', group: 'Пізнавальні'},
	{dName: 'Eurosport 4K', group: 'Пізнавальні'},
	{dName: 'Eurosport 2', flags: 'hd', group: 'Пізнавальні'},
	//Охота и рыбалка
	{dName: 'Трофей', group: 'Пізнавальні'},
	{dName: 'Охота и рыбалка', group: 'Пізнавальні'},
	{dName: 'Дикая рыбалка', flags: 'hd', group: 'Пізнавальні'},
	{dName: 'Охотник и рыболов', tvgName: 'Охотник и рыболов HD', flags: 'hd', group: 'Пізнавальні'},

	//Разное
	{dName: 'ZOOM', group: 'Розважальні'},
	{dName: 'Мама', group: 'Розважальні'},
	{dName: 'СТС', group: 'Розважальні'},
	{dName: 'ТНТ', flags: 'req', group: 'Розважальні'},
	{dName: 'Че', group: 'Розважальні'},
	{dName: 'КВН ТВ', group: 'Розважальні'},
	{dName: 'Суббота!', group: 'Розважальні'},

	// SK
	{dName: 'JOJ', sName: 'JOJ|TV JOJ 720p', flags: 'm3', tvgName: 'JOJ.sk', group: 'SK'},
	{dName: 'JOJ Plus HD', sName: 'JOJ Plus', flags: 'm3', tvgName: 'JOJPlus.sk', group: 'SK'},
	{dName: 'WAU HD', sName: 'WAU', flags: 'm3', tvgName: 'Wau.sk', group: 'SK'},
	{dName: 'Markíza', sName: 'Markíza|TV Markíza|Markiza|TV Markiza', flags: 'm3', tvgName: "Markiza.sk", group: 'SK'},
	{dName: 'JOJ Family', flags: 'm3', tvgName: "JOJFamily.sk", group: 'SK'},
	{dName: 'Dajto', sName: 'Dajto|TV Dajto|Dajto HD', flags: 'm3', group: 'SK'},
	{dName: 'Doma HD', sName: 'Doma', flags: 'm3', group: 'SK'},
	{dName: 'Jednotka', sName: 'Jednotka|STV 1', flags: 'm3', group: 'SK'},
	{dName: 'Dvojka', sName: 'Dvojka|STV 2', flags: 'm3', group: 'SK'},
	{dName: 'Kosice dnes', flags: 'm3', group: 'SK'},
	{dName: 'CE TV', flags: 'm3', group: 'SK'},
	{dName: 'TA3', flags: 'm3', group: 'SK'},

	//Музыка
	{dName: 'Music Box UA', sName: 'Music Box UA|Music Box UA HD', tvgName: 'Music Box UA HD', group: 'Музика'},
	{dName: 'М1', sName: 'М1|M1', tvgName: 'M1', flags: 'req', group: 'Музика'},
	{dName: 'М2', sName: 'М2|M2', tvgName: 'M2', group: 'Музика'},
	{dName: 'MTV', group: 'Музика'},
	{dName: 'MTV Live', flags: 'hd', group: 'Музика'},
	{dName: 'MTV 90s', group: 'Музика'},
	{dName: 'Europa Plus TV', group: 'Музика'},

	// Кухня
	{dName: 'Еда HD', sName: 'Еда ТВ|Еда|Еда HD|ЕДА Премиум', group: 'Кухня'},
	{dName: 'Кухня ТВ', tvgName: 'Кухня ТВ', flags: 'req', group: 'Кухня'},
	{dName: 'Food Network', sName: 'Food Netwоrk|Food Network', tvgName: 'Food Network HD', flags: 'hd', group: 'Кухня'},

	// Новостные
	{dName: 'Украина 24', group: 'Новини'},
	{dName: 'Перший незалежний', flags: 'hd', group: 'Новини'},
	{dName: '5 канал (Украина)', sName: '5 канал \\(Украина\\)|5 канал', tvgName: '5 канал', group: 'Новини'},
	{dName: '24 канал', group: 'Новини'},
	{dName: 'Еспресо ТВ', sName: 'Еспресо ТВ|Еспресо\\.tv|Еспресо|Eспресо TV|Эспресо ТВ HD', tvgName: 'Eспресо TV', group: 'Новини'},
	{dName: 'Прямий', flags: 'hd', group: 'Новини'}
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

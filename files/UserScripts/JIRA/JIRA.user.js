// ==UserScript==
// @name         JIRA templates
// @version      0.1
// @description  Quick templates for JIRA (can be used on any textarea elements) 
// @author       Alexey
// @match        https://menswearhouse.atlassian.net/*
// @match        http://jira.ontrq.com/*
// @updateURL	 http://avasin.ml/UserScripts/JIRA/JIRA.user.js
// ==/UserScript==

/* Extend Jquery with serializeObject method for forms */
$.fn.serializeObject = function(){
	var o = {},
		a = this.serializeArray();
	$.each(a, function() {
		if (o[this.name] !== undefined) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		} else {
			o[this.name] = this.value || '';
		}
	});
	return o;
};

/* MODAL CLASS */
var Modal = function(params){
	this.bgClass = 'b-modal';
	this.modalClass = 'modal';
	this.contentClass = 'container';
	this.closeClass = 'close';
	this.activeClass = 'active';
	this.contentWidth = 500;

	//Init entry params
	this.initParams(params);

	//Base init
	this.init();
}

Modal.prototype.initParams = function(params){
	for(var param in params){
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
}
Modal.prototype.init = function(param){
	this.createDom();
	this.addCustomStyles();
	this.registerEvents();
}
Modal.prototype.addCustomStyles = function(){
	var $styles = $("<style/>").html(
		'.'+ this.modalClass +'{display: none;position: fixed;width: '+ this.contentWidth +'px;top: 50%;left: 50%;margin: -200px 0 0 -'+ this.contentWidth/2 +'px;z-index: 99999;background: #000;box-shadow: 0 0 4px 1px #00A08D;border-radius: 5px;}'+
		'.'+ this.modalClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.modalClass +' .'+ this.contentClass +'{width:100%; height: 100%;padding: 3%;box-sizing: border-box;text-align:center;}'+
		'.'+ this.modalClass +' video{width: auto;height: auto;max-width: 100%;max-height: 100%;}'+
		'.'+ this.bgClass +'{position: fixed;width: 100%;height: 100%;background: #000;z-index: 99999;top: 0;opacity: 0.5;display: none;}'+
		'.'+ this.bgClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.closeClass +'{position: absolute;right: 10px;top: 5px;color: #C9F2F9;font: normal 20px arial;cursor: pointer;}'
	);
	$('head').append($styles);
}	
Modal.prototype.createDom = function(){
	$('body').append('<div class="'+ this.bgClass +'"></div>')
		.append('<div class="'+ this.modalClass +'"><div class="'+ this.closeClass +'">✖</div><div class="'+ this.contentClass +'"></div></div>')
}
Modal.prototype.registerEvents = function(){
	$(document).on('click', '.'+ this.closeClass, $.proxy(this, 'hide'));
	$(document).on('click', '.'+ this.bgClass, $.proxy(this, 'hide'));
}
Modal.prototype.updatePosition = function(){
	var $modal = $('.'+ this.modalClass);

	if($modal.height() >= window.innerHeight){
		$modal.height(window.innerHeight - 150);
	}

	$modal.css({'margin-top': - $modal.height()/2});
}
Modal.prototype.show = function(content, callback){
	$('.'+ this.bgClass).addClass(this.activeClass);
	$('.'+ this.modalClass).addClass(this.activeClass).find('.'+ this.contentClass).html(content);
	this.videoReady();
	if(callback) callback();
}
Modal.prototype.videoReady = function(){
	$('.'+ this.modalClass +' video').each(function(){
		$(this).one('loadeddata', function(){
			modal.updatePosition();
		});
	});
}
Modal.prototype.removeVideos = function(){
	$('.'+ this.modalClass +' video').each(function(){
		this.pause();
		this.src = '';
		$(this).remove();
	});
}
Modal.prototype.hide = function(){
	this.removeVideos();
	$('.'+ this.bgClass).removeClass(this.activeClass);
	$('.'+ this.modalClass).removeClass(this.activeClass).css({'height':'', 'margin-top':''}).find('.'+ this.contentClass).html('');
}

var _T = {
	cache: {},
	escape: function(str){
		return str.replace(/\r/g, "-r-")
					.replace(/\t/g, "-t-")
					.replace(/\n/g, "-n-");
	},
	unEscape: function(str){
		return str.replace(/-r-/g, "\r")
					.replace(/-t-/g, "\t")
					.replace(/-n-/g, "\n");
	},
	getT: function(str, data){
		var that = this;
		try{
			var fn = !/\W/.test(str) ?
				this.cache[str] = this.cache[str] ||
				this.getT(document.getElementById(str).innerHTML) :

				new Function("obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +
				"with(obj){p.push('" +
				that.escape(str)						
					.split("<%").join("\t")
					.replace(/((^|%>)[^\t]*)'/g, "$1\r")
					.replace(/\t=(.*?)%>/g, "',$1,'")
					.split("\t").join("');")
					.split("%>").join("p.push('")
					.split("\r").join("\\'")
					+ "');}return p.join('');");

			return data ? that.unEscape( fn(data) ) : that.unEscape(fn);
		}
		catch(e){
			console.error(e.message /* + '\n' + e.stack*/);
			return '';
		}
	},
	getTemplParamsNames: function(templString){
		var params = templString.match(/<%=.*?%>/gm);

		//Return empty array in case there is no params in a string
		if(!params)
			return [];

		for(var i=0; i<params.length; i++)
			params[i] =  params[i].replace(/<%=\s*|\s*%>/g, '');

		return params;
	}
};

/* TEMPLATES CLASS */
var Templates = function(params){
	this.isLog = true;

	this.commentSel = 'textarea';
	this.templContainerClass = 'templ-cont';
	this.templListClass = 'templ-list';
	this.noTemplMsgClass = 'empty-templ-msg';
	this.templItemClass = 'js-templ-item';
	this.templAddClass = 'js-templ-action-add';
	this.addTemlFormClass = 'js-add-form';
	this.applyTemplParamsFormClass = 'js-apply-params';

	this.templItemSel = '[data-templ]';

	this.$head = $('head');

	//Init entry params
	this.initParams(params);

	//Init associate params
	this.initAssociateParams();

	//Custom init
	this.init();
}
Templates.prototype.initParams = function(params){
	for(var param in params){	
		if (params.hasOwnProperty(param))
			this[param] = params[param];
	}
}
Templates.prototype.initAssociateParams = function(){
	//Set params based on another params
	this.$comments = $(this.commentSel);

	this._templButton = '<div class="'+ this.templContainerClass +'">'+
						'<div class="'+ this.templListClass +'">'+
							'<% if(! jQuery.isEmptyObject(templates) ){ %>'+
								'<ul>'+
									'<% for(var key in templates){ %>'+
										'<li class="'+ this.templItemClass +'">'+
											'<a href="#" data-templ="<%= key %>"> <%= key %></a>'+
										'</li>'+
									'<% } %>'+
								'</ul>'+
							'<% }else{ %>'+
								'<div class="'+ this.noTemplMsgClass +'">You dont have any templates yet.</div>'+
							'<% } %>'+
							'<a href="#" title="Add new template" class="'+ this.templAddClass +'">Add template</a>'+
						'</div>'+
					'</div>';
	this._newTeml = '<form class="'+ this.addTemlFormClass +'">'+
						'<h3>Add template form</h3>'+
						'<input type="text" name="name" placeholder="Name of template" required>'+
						'<textarea name="value" placeholder="Template" required></textarea>'+
						'<input type="submit" value="Add">'+
					'</form>';
	this._paramsDialog = '<form class="'+ this.applyTemplParamsFormClass +'">'+
							'<h3>Fill out parameters for template "<%= templName %>".</h3>'+
							'<% for(var i=0; i<params.length; i++){ %>'+
								'<textarea name="<%= params[i] %>" placeholder="Value for parameter <%= params[i] %>"></textarea>'+
							'<% } %>'+
							'<input type="hidden" name="templName" value="<%= templName %>">'+
							'<input type="submit" value="Apply">'+
						'</form>';
}
Templates.prototype.init = function(){
	this.registerEvents();
	this.addCustomStyles();
	this.addTemplButton();
};
Templates.prototype.log = function(msg){
	if(this.isLog)
		console.info(msg);
}
Templates.prototype.registerEvents = function(){
	//Add template link (open modal dialog with form)
	$(document).on('click', '.'+ this.templAddClass, $.proxy(this.openAddTemplModal, this));

	//Add form handler
	$(document).on('submit', '.'+ this.addTemlFormClass, $.proxy(this.addTempl, this));

	//Apply params handler
	$(document).on('submit', '.'+ this.applyTemplParamsFormClass, $.proxy(this.onApplyParams, this));

	//Template item
	$(document).on('click', this.templItemSel, $.proxy(this.applyTemplItem, this));
}

Templates.prototype.addCustomStyles = function(){
	var $styles = $("<style/>").html(
		'.'+ this.templContainerClass +'{position:absolute; margin:0 0 0 -15px;}'+
		'.'+ this.templContainerClass +' a{text-decoration:underline; color:#FFF;}'+
		'.'+ this.templContainerClass +' a:hover{text-decoration:none;}'+
		'.'+ this.templContainerClass +':before{content:""; width:15px; height:15px; display:block; background:#3B73AF; border-radius:50% 0 0 50%; cursor:pointer}'+
		'.'+ this.templListClass +'{display:none; z-index:1; position:absolute; left:15px; top:0; width:250px; padding:10px; background:#3B73AF; color:#FFF; border-radius:0 5px 5px;}'+
		'.'+ this.templAddClass +'{display:block; text-align:center; margin-top:10px;}'+
		'.'+ this.noTemplMsgClass +'{text-align:center}'+
		'.'+ this.templContainerClass +':hover .'+ this.templListClass +'{display:block;}'
	);

	this.$head.append($styles);
}
Templates.prototype.addTemplButton = function(){
	var templButton = this.getTemplButton();

	this.log(templButton);

	this.$comments.each(function(){
		$(templButton).insertBefore(this);
	});
}
Templates.prototype.applyTemplItem = function(e){
	e.preventDefault();
	var $this = $(e.currentTarget),
		templName = $this.attr('data-templ'),
		templ = this.getTemlByName(templName),
		templParams = _T.getTemplParamsNames(templ);

	if(templParams.length)
		this.showParamsDialog(templName, templParams);
	else
		this.applyTempl(templName);
}
Templates.prototype.applyTempl = function(templName, data){
	var data = data ? data : {},
		templ = this.getTemlByName(templName);

	this.log(_T.getT(templ, data));
}
Templates.prototype.onApplyParams = function(e){
	e.preventDefault();
	var $this = $(e.currentTarget),
		data = $this.serializeObject();

	this.applyTempl(data.templName, data);
	modal.hide();
}
Templates.prototype.getTemlByName = function(name){
	return JSON.parse(localStorage.templates)[name];
}
Templates.prototype.getSavedTempls = function(){
	return typeof localStorage.templates != 'undefined' ? JSON.parse(localStorage.templates) : {};
}
Templates.prototype.getTemplButton = function(){
	return templatesHtml = _T.getT(this._templButton, {templates: this.getSavedTempls()});    
}
Templates.prototype.openAddTemplModal = function(e){
	e.preventDefault();

	modal.show(this._newTeml);
}
Templates.prototype.addTempl = function(e){
	e.preventDefault();

	var $this = $(e.currentTarget),
		data = $this.serializeObject();

	this.saveTempl(data);
}
Templates.prototype.showParamsDialog = function(templName, params){
	var data = {
		templName: templName,
		params: params
	}
	modal.show(_T.getT(this._paramsDialog, data));
}
Templates.prototype.saveTempl = function(data){
	var savedTempl = this.getSavedTempls();

	savedTempl[$.trim(data.name)] = data.value;

	localStorage.templates = JSON.stringify(savedTempl);

	modal.hide();
}

var modal = new Modal();
var templates = new Templates();

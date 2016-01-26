// ==UserScript==
// @name         JIRA templates
// @version      1.0
// @description  Quick templates for JIRA (can be used on any textarea elements) 
// @author       Alexey Vasin
// @match        https://menswearhouse.atlassian.net/*
// @match        http://jira.ontrq.com/*
// @updateURL	 http://avasin.ml/UserScripts/JIRA/JIRA.user.js
// ==/UserScript==

var $ = jQuery;
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
		'.'+ this.modalClass +'{display: none;position: fixed;width: '+ this.contentWidth +'px;top: 50%;left: 50%;margin: -200px 0 0 -'+ this.contentWidth/2 +'px;z-index: 99999;background: #000;border-radius: 5px;}'+
		'.'+ this.modalClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.modalClass +' .'+ this.contentClass +'{width:100%; height: 100%;box-sizing: border-box;text-align:center;}'+
		'.'+ this.modalClass +' video{width: auto;height: auto;max-width: 100%;max-height: 100%;}'+
		'.'+ this.bgClass +'{position: fixed;width: 100%;height: 100%;background: #000;z-index: 99999;top: 0;opacity: 0.5;display: none;}'+
		'.'+ this.bgClass +'.'+ this.activeClass +'{display: block;}'+
		'.'+ this.closeClass +'{position: absolute;right: 10px;top: 5px;color: #000;font: normal 20px arial;cursor: pointer; z-index:5;}'+
		'.'+ this.closeClass +':hover,.'+ this.closeClass +':focus,.'+ this.closeClass +':active{text-decoration: none;}'
	);
	$('head').append($styles);
}	
Modal.prototype.createDom = function(){
	$('body').append('<div class="'+ this.bgClass +'"></div>')
		.append('<div class="'+ this.modalClass +' jira-dialog"><a href="#" class="'+ this.closeClass +'" title="Close popup. Tip: you can also use Esc button.">✖</a><div class="'+ this.contentClass +' jira-dialog-content "></div></div>')
}
Modal.prototype.registerEvents = function(){
	$(document).on('click', '.'+ this.closeClass, $.proxy(this, 'hide'));
	$(document).on('click', '.'+ this.bgClass, $.proxy(this, 'hide'));
	$(document).on('keydown', '.'+ this.modalClass, $.proxy(this, 'onKeyPress'));
}
Modal.prototype.onKeyPress = function(e){
	var $this = $(document.activeElement),
		$context = $this.closest('.'+ this.modalClass),
		$focusableElements = $context.find(':focusable'),
		$firstFocusable = $focusableElements.first(),
		$lastFocusable = $focusableElements.last();

	switch(e.keyCode){
		//Escape key pressed
		case 27:
			this.hide();
			break;
		//Tab key pressed
		case 9:
			//Shift + Tab on first element in popup
			if($this[0] == $firstFocusable[0] && e.shiftKey){
				e.preventDefault();
				$lastFocusable.focus();
			}
			//Tab on last element in popup
			else if($this[0] == $lastFocusable[0] && !e.shiftKey){
				e.preventDefault();
				$firstFocusable.focus();	
			}
			break;
	}
}
Modal.prototype.updatePosition = function(){
	var $modal = $('.'+ this.modalClass);

	if($modal.height() >= window.innerHeight){
		$modal.height(window.innerHeight - 150);
	}

	$modal.css({'margin-top': - $modal.height()/2});
}
Modal.prototype.show = function(content, callback){
    var $modal = $('.'+ this.modalClass),
        $bg = $('.'+ this.bgClass);

	$bg.addClass(this.activeClass);
    $modal.addClass(this.activeClass).find('.'+ this.contentClass).html(content);
    $modal.find(':focusable:eq(1)').focus();
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
Modal.prototype.hide = function(e){
	if(e) e.preventDefault();

	this.removeVideos();
	$('.'+ this.bgClass).removeClass(this.activeClass);
	$('.'+ this.modalClass).removeClass(this.activeClass).css({'height':'', 'margin-top':''}).find('.'+ this.contentClass).html('');
}

var _T = {
    cache: {},
	splitParamSymb: '_',
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
    },
	getTemplParamsObj: function(templString){
		var paramsArray = this.getTemplParamsNames(templString),
			paramsObj = {};
		
		for(var i=0; i<paramsArray.length; i++)
			paramsObj[paramsArray[i]] = false;
		
		return paramsObj;
	},
	updateTemplateParams: function(string){
		var that = this,
			regExp = /(?:<%=)(.*)?(?:%>)/gm;		

		return string.replace(regExp, function(match, g1){
			return '<%= ' + ($.trim(g1)).replace(/\s+/g, that.splitParamSymb) +' %>';
		});
	}
};

/* TEMPLATES CLASS */
var Templates = function(params){
	this.isLog = true;
	
	this.defaultTempls = {};

	this.commentSel = 'textarea';
	this.templContainerClass = 'templ-cont';
	this.templListClass = 'templ-list';
	this.noTemplMsgClass = 'empty-templ-msg';
	this.templItemLinkClass = 'templ-item-link';
	this.templItemActionsClass = 'templ-item-actions';
	this.templItemClass = 'js-templ-item';
	this.templAddClass = 'js-templ-action-add';
	this.addTemlFormClass = 'js-add-form';
	this.applyTemplParamsFormClass = 'js-apply-params';
	this.saveDefaultsFormClass = 'js-save-default-params';
	this.commentAttr = 'data-comm';
	this.templNameAttr = 'data-templ-name';

	this.applyTemplClass = 'js-apply-templ';
	this.editTemplClass = 'js-edit-templ';
	this.delTemplClass = 'js-del-templ';
	this.confTemplClass = 'js-conf-templ';

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
    this._templButton = '<div class="'+ this.templContainerClass +'" '+ this.commentAttr +'="<%= uniqueAttr %>">'+
                            '<div class="'+ this.templListClass +'">'+
                                '<% if(! jQuery.isEmptyObject(templates) ){ %>'+
                                    '<ul>'+
                                        '<% for(var key in templates){ %>'+
                                            '<li class="'+ this.templItemClass +'" '+ this.templNameAttr +'="<%= key %>">'+
                                                '<a class="'+ this.templItemLinkClass +' '+ this.applyTemplClass +'" href="#" title="Apply template item."><%= key %></a>'+
												'<span class="'+ this.templItemActionsClass +'">'+
													'<% if(!jQuery.isEmptyObject(defaults[key])){ %>'+
														'<a href="#" class="'+ this.confTemplClass +' aui-icon aui-icon-small aui-iconfont-configure" title="Configure default parameters in template.">conf</a> '+
													'<% } %>'+
													'<a href="#" class="'+ this.editTemplClass +' aui-icon aui-icon-small aui-iconfont-edit" title="Edit template item.">edit</a> '+
													'<a href="#" class="'+ this.delTemplClass +' aui-icon aui-icon-small aui-iconfont-delete" title="Remove template item.">del</a>'+
												'</span>'+
                                            '</li>'+
                                        '<% } %>'+
                                    '</ul>'+
                                '<% }else{ %>'+
                                    '<div class="'+ this.noTemplMsgClass +'">You dont have any templates yet.</div>'+
                                '<% } %>'+
                                '<a href="#" title="Add new template" class="'+ this.templAddClass +'">Add template</a>'+
                            '</div>'+
                        '</div>';
    this._newTeml = '<form class="'+ this.addTemlFormClass +' aui">'+
                        '<h2 class="jira-dialog-heading">'+
                            'New template: '+
                            '<input class="templName" type="text" name="name" placeholder="Name of template" required>'+
                        '</h2>'+
                        '<div class="jira-dialog-main-section">'+
                            '<textarea class="locked" name="value" placeholder="Template" required></textarea>'+
                        '</div>'+
                        '<div class="buttons-container">'+
                            '<input class="button" type="submit" value="Add">'+
                        '</div>'+
                    '</form>';
	this._editTeml = '<form class="'+ this.addTemlFormClass +' aui">'+
                        '<h2 class="jira-dialog-heading">'+
                            'Edit template: '+
                            '<input class="templName" type="text" name="name" placeholder="Name of template" value="<%= name %>" required>'+
                        '</h2>'+
                        '<div class="jira-dialog-main-section">'+
                            '<textarea class="locked" name="value" placeholder="Template" required><%= templ %></textarea>'+
                        '</div>'+
                        '<div class="buttons-container">'+
                            '<input class="button" type="submit" value="Edit">'+
                        '</div>'+
                    '</form>';
	this._confTeml = '<form class="'+ this.saveDefaultsFormClass +' aui">'+
                        '<h2 class="jira-dialog-heading">Edit default parameters for "<%= templName %>".</h2>'+
                        '<div class="jira-dialog-main-section">'+
							'<ul class="defaults-list">'+
								'<% for(var param in params){ %>'+
									'<li>'+
										'<label for="label-<%= param %>"><%= param %>:</label>'+
										'<textarea id="label-<%= param %>" class="locked" name="<%= param %>" placeholder="<%= param %>">'+
											'<% if(params[param]){ %>'+
												'<%= params[param] %>'+
											'<% } %>'+
										'</textarea>'+
									'</li>'+
								'<% } %>'+
							'</ul>'+
							'<input type="hidden" name="templName" value="<%= templName %>">'+
                        '</div>'+
                        '<div class="buttons-container">'+
                            '<input class="button" type="submit" value="Save">'+
                        '</div>'+
                    '</form>';
    this._paramsDialog = '<form class="'+ this.applyTemplParamsFormClass +' aui">'+
                            '<h2 class="jira-dialog-heading">Fill out parameters for template "<%= templName %>".</h2>'+
                            '<div class="jira-dialog-main-section">'+
                                '<% for(var param in params){ %>'+
                                    '<textarea class="locked" name="<%= param %>" placeholder="<%= param %>">'+
										'<% if(params[param]){ %>'+
											'<%= params[param] %>'+
										'<% } %>'+
									'</textarea>'+
                                '<% } %>'+
                                '<input type="hidden" name="templName" value="<%= templName %>">'+
                            '</div>'+
                            '<div class="buttons-container">'+
                                '<input class="button" type="submit" value="Apply">'+
                            '</div>'+
                        '</form>';
}
Templates.prototype.init = function(){
	this.addDefaultTemplates();
	this.registerEvents();
	this.addCustomStyles();
	this.addTemplBtns();
};
Templates.prototype.log = function(msg){
	if(this.isLog)
		console.info(msg);
}
Templates.prototype.registerEvents = function(){
	//Init templates on mouse hover on textarea
	$(document).on('mouseenter', this.commentSel +':not(['+ this.commentAttr +']):not(.locked)', $.proxy(this, 'addTemplBtn'));

    //Add template link (open modal dialog with form)
	$(document).on('click', '.'+ this.templAddClass, $.proxy(this, 'openAddTemplModal'));

    //Add template handler
    $(document).on('submit', '.'+ this.addTemlFormClass, $.proxy(this, 'addTempl'));

    //Apply template params handler
    $(document).on('submit', '.'+ this.applyTemplParamsFormClass, $.proxy(this, 'onApplyParams'));
	
	//Apply template default parameters hendler
    $(document).on('submit', '.'+ this.saveDefaultsFormClass, $.proxy(this, 'onSaveDefaults'));

    //Apply template item
    $(document).on('click', '.'+ this.applyTemplClass, $.proxy(this, 'onApplyTemplItem'));
	
	//Edit template item
	$(document).on('click', '.'+ this.editTemplClass, $.proxy(this, 'onEditTemplItem'));
	
	//Remove template item
	$(document).on('click', '.'+ this.delTemplClass, $.proxy(this, 'onDelTemplItem'));
	
	//Config default params for template item
	$(document).on('click', '.'+ this.confTemplClass, $.proxy(this, 'onConfTemplItem'));

    //Show/hide template options
    $(document).on('mouseenter', '.'+ this.templContainerClass, $.proxy(this, 'showOptions'))
                .on('mouseleave', '.'+ this.templContainerClass, $.proxy(this, 'hideOptions'));
}

Templates.prototype.addCustomStyles = function(){
    var $styles = $("<style/>").html(
        '.'+ this.templContainerClass +'{position:absolute; margin:0 0 0 -12px;}'+
        '.'+ this.templContainerClass +' a{text-decoration:underline; color:#FFF;}'+
        '.'+ this.templContainerClass +' a:hover{text-decoration:none;}'+
        '.'+ this.templContainerClass +':before{content:""; width:12px; height:30px; display:block; background:#3B73AF; border-radius:50% 0 0 50%; cursor:pointer}'+
        '.'+ this.templListClass +'{z-index:1; position:absolute; left:12px; top:0; width:250px; padding:10px; background:#3B73AF; color:#FFF; border-radius:0 5px 5px;transition:all 0.2s ease-in-out; display: none;}'+        
        'body .'+ this.templListClass +' ul{margin:0; padding:0;}'+
        '.'+ this.templAddClass +'{display:block; text-align:center; margin-top:10px;}'+
        '.'+ this.noTemplMsgClass +'{text-align:center}'+
        '.'+ this.templContainerClass +'.active .'+ this.templListClass +'{display: block;}'+
        '.jira-dialog-main-section {padding: 5px 10px 0;}'+
        '.jira-dialog-main-section textarea {width: 99%; max-width: 99%; margin-bottom: 5px; display:block; padding:1%; box-sizing:border-box;}'+
        '.templName {border-width:0 0 1px; border-color:#000; font-size:20px; background:transparent; color:#333; width:200px;}'+
        '.'+ this.addTemlFormClass +' textarea{height: 300px}'+
		'.'+ this.templItemLinkClass +',.'+ this.templItemActionsClass +'{display: inline-block; vertical-align: top;}'+
		'.'+ this.templItemLinkClass +'{max-width: 73%; float:left;}'+
		'.'+ this.templItemActionsClass +'{text-align:right; float:right;}'+
		'.defaults-list{padding:0; list-style-type:none;}'+
		'.defaults-list li{overflow: hidden;}'+
		'.defaults-list label{float: left; width: 28%; padding-right: 2%; text-align: right;}'+
		'.defaults-list textarea{float: left; width: 70%;}'+
		'.'+ this.templItemActionsClass +' .'+ this.delTemplClass +'{color:#FF887F;}'+
		'.'+ this.templItemActionsClass +' .'+ this.editTemplClass +'{color: #64FD6A;}'+
		'.'+ this.templItemClass +'{border-top:1px solid transparent; border-bottom:1px solid transparent; overflow: hidden; padding: 0 2px;}'+
		'.'+ this.templItemClass +':hover{border-color:#fff;}'+
		'.'+ this.templItemClass +' a{text-decoration:none;}'+
		'.'+ this.templItemClass +' a:hover{text-shadow:0 0 1px #FFF;}'
    );

    this.$head.append($styles);
}
Templates.prototype.addDefaultTemplates = function(){
    var isNoSavedTempls = $.isEmptyObject(this.getSavedTempls());

    if(isNoSavedTempls){
		for(var templ in this.defaultTempls)
			this.saveTempl(templ, this.defaultTempls[templ])
	}
}
Templates.prototype.addTemplBtns = function(){
    var that = this;

    $(this.commentSel +':not(['+ this.commentAttr +']):not(.locked)').each(function(){
		that.addTemplBtn({currentTarget: this});
    });
}
Templates.prototype.addTemplBtn = function(e){
	var $this = $(e.currentTarget),
		uniqueAttr = 'c-'+ new Date().getTime(),
		templButton = this.getTemplButton(uniqueAttr);

	$this.attr(this.commentAttr, uniqueAttr);
	$(templButton).insertBefore(e.currentTarget);
}
Templates.prototype.onApplyTemplItem = function(e){
    e.preventDefault();
    var templName = this.getTemplNameFromParent(e),
        templ = this.getTemlByName(templName),
        templParams = this.getTemplDefaults(templName);

    this.hideOptions();

    if(!$.isEmptyObject(templParams))
        this.showParamsDialog(templName, templParams);
    else
        this.applyTempl(templName);
}
Templates.prototype.onEditTemplItem = function(e){
	e.preventDefault();
	var templName = this.getTemplNameFromParent(e),
		templ = this.getTemlByName(templName);
	
	this.hideOptions();

	modal.show(_T.getT(this._editTeml, {
		name: templName,
		templ: templ
	}));
}
Templates.prototype.onDelTemplItem = function(e){
	e.preventDefault();
	var templName = this.getTemplNameFromParent(e);
	
	this.delTempl(templName);
}
Templates.prototype.onConfTemplItem = function(e){
	e.preventDefault();
	var templName = this.getTemplNameFromParent(e),
		templParams = this.getTemplDefaults(templName);
	
	this.hideOptions();
	
	modal.show(_T.getT(this._confTeml, {
		templName: templName,
		params: templParams
	}));
}
Templates.prototype.onSaveDefaults = function(e){
	e.preventDefault();
	var $this = $(e.currentTarget),
		data = $this.serializeObject(),
		templName = data.templName;
	
	delete data.templName;
	this.saveTemplDefaults(templName, data);
}
Templates.prototype.onApplyParams = function(e){
	e.preventDefault();
	var $this = $(e.currentTarget),
		data = $this.serializeObject();

	this.applyTempl(data.templName, data);
	modal.hide();
}
Templates.prototype.applyTempl = function(templName, data){
    var data = data ? data : {},
        templ = this.getTemlByName(templName),
        oldValue = this.$activeComment.val();

    this.$activeComment.val(oldValue + _T.getT(templ, data));
}
Templates.prototype.showOptions = function(e){
    var $this = $(e.currentTarget),
        commentId = $this.attr(this.commentAttr);
    
    $this.addClass('active');
    this.$activeComment = $(this.commentSel +'['+ this.commentAttr +'="'+ commentId +'"]');
}
Templates.prototype.hideOptions = function(e){
    $('.'+ this.templContainerClass).removeClass('active');
}
Templates.prototype.getTemplNameFromParent = function(e){
	var $this = $(e.currentTarget),
		$templItem = $this.closest('.'+ this.templItemClass);
	
	return $templItem.attr(this.templNameAttr);
}
Templates.prototype.getTemlByName = function(name){
	return this.getSavedTempls()[name];
}
Templates.prototype.getSavedTempls = function(){
	var templs = GM_getValue('templates');
	return typeof templs != 'undefined' ? JSON.parse(templs) : {};
}
Templates.prototype.getSavedDefaults = function(){
	var defaults = GM_getValue('templ-defaults');
	return typeof defaults != 'undefined' ? JSON.parse(defaults) : {};
}
Templates.prototype.getTemplDefaults = function(name){
	return this.getSavedDefaults()[name];
}
Templates.prototype.getTemplButton = function(uniqueAttr){
    var data = {
        templates: this.getSavedTempls(),
		defaults: this.getSavedDefaults(),
        uniqueAttr: uniqueAttr
    }
    return templatesHtml = _T.getT(this._templButton, data);    
}
Templates.prototype.openAddTemplModal = function(e){
	e.preventDefault();

	modal.show(this._newTeml);
}
Templates.prototype.addTempl = function(e){
    e.preventDefault();
    var $this = $(e.currentTarget),
        data = $this.serializeObject(),
		templName = ($.trim(data.name)).replace(/\s/g, '_'),
		templString = _T.updateTemplateParams(data.value),
		paramsObj = _T.getTemplParamsObj(templString);

	//Save dafaults if parameters object is not empty
	if(!$.isEmptyObject(paramsObj))
		this.saveTemplDefaults(templName, paramsObj);

    this.saveTempl(templName, templString);
	this.refreshButtons();
}
Templates.prototype.showParamsDialog = function(templName, params){
	var data = {
		templName: templName,
		params: params
	}
	modal.show(_T.getT(this._paramsDialog, data));
}
Templates.prototype.delTempl = function(templName){
	var savedTempl = this.getSavedTempls();

	delete savedTempl[templName];

	GM_setValue('templates', JSON.stringify(savedTempl));

	modal.hide();
	this.refreshButtons();
}
Templates.prototype.saveTemplDefaults = function(templName, params){
	var defaults = this.getSavedDefaults();
	
	defaults[templName] = params;
	
	GM_setValue('templ-defaults', JSON.stringify(defaults));
	
	modal.hide();
}
Templates.prototype.saveTempl = function(templName, templString){
	var savedTempl = this.getSavedTempls();

	savedTempl[templName] = templString;

	GM_setValue('templates', JSON.stringify(savedTempl));

	modal.hide();
}
Templates.prototype.removeButtons = function(){
	$('.'+ this.templContainerClass).remove();
	$('.'+ this.commentSel).attr(this.commentAttr, null);
}
Templates.prototype.refreshButtons = function(){
	this.removeButtons();
	this.addTemplBtns();
}
var modal = new Modal();
var templates = new Templates({
	defaultTempls: {
		Send_to_review: 'Hi <%= reviewer_name %>,\n\n'+
						'Please review the code.\n\n'+
						'Thanks in advance.',
		Code_approved: 'Code looks good.\n'+
						'No comments or objections.',
		Implemented: '<%= implemented_stuff %> has been implemented.\n\n'+
					'Thanks,\nAlexey.'
	}
});

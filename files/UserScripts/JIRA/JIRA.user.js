// ==UserScript==
// @name			JIRA templates
// @version			1.3
// @description		Quick templates for JIRA (can be used on any textarea elements)
// @author			Alexey Vasin
// @require			https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js
// @require			https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2014-11-29/FileSaver.min.js
// @include			/https?\:\/\/menswearhouse\.atlassian\.net.*/
// @include			/https?\:\/\/jira\.ontrq\.com.*/
// @grant			GM_setValue
// @grant			GM_getValue
// @updateURL		http://avasin.cf/UserScripts/JIRA/JIRA.user.js
// ==/UserScript==

try{
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
	$.fn.getFocusable = function(){
		return this.find('a[href], area[href], input, select, textarea, button, iframe, object, embed, *[tabindex], *[contenteditable]')
					.not('[tabindex=-1], [disabled], :hidden');
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
	};
	Modal.prototype.initParams = function(params){
		for(var param in params){
			if (params.hasOwnProperty(param))
				this[param] = params[param];
		}
	};
	Modal.prototype.init = function(param){
		this.createDom();
		this.addCustomStyles();
		this.registerEvents();
	};
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
	};
	Modal.prototype.createDom = function(){
		$('body').append('<div class="'+ this.bgClass +'"></div>')
			.append('<div class="'+ this.modalClass +' jira-dialog"><a href="#" class="'+ this.closeClass +'" title="Close popup. Tip: you can also use Esc button.">✖</a><div class="'+ this.contentClass +' jira-dialog-content "></div></div>');
	};
	Modal.prototype.registerEvents = function(){
		$(document).on('click', '.'+ this.closeClass, $.proxy(this.hide, this))
					.on('click', '.'+ this.bgClass, $.proxy(this.hide, this))
					.on('keydown', '.'+ this.modalClass, $.proxy(this.onKeyPress, this));
	};
	Modal.prototype.onKeyPress = function(e){
		var $this = $(document.activeElement),
			$closestForm = $this.closest('form'),
			$context = $this.closest('.'+ this.modalClass),
			$focusableElements = $context.getFocusable(),
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
			//Enter key pressed
			case 13:
				//Ctrl + Enter will submit the form
				if(e.ctrlKey) $closestForm.trigger('submit');
		}
	};
	Modal.prototype.updatePosition = function(){
		var $modal = $('.'+ this.modalClass);

		if($modal.height() >= window.innerHeight){
			$modal.height(window.innerHeight - 150);
		}

		$modal.css({'margin-top': - $modal.height()/2});
	};
	Modal.prototype.show = function(content, callback){
		var $modal = $('.'+ this.modalClass),
			$bg = $('.'+ this.bgClass);

		$bg.addClass(this.activeClass);
		$modal.addClass(this.activeClass).find('.'+ this.contentClass).html(content);
		$modal.getFocusable().eq(1).focus();
		this.videoReady();
		if(callback) callback();
	};
	Modal.prototype.videoReady = function(){
		$('.'+ this.modalClass +' video').each(function(){
			$(this).one('loadeddata', function(){
				modal.updatePosition();
			});
		});
	};
	Modal.prototype.removeVideos = function(){
		$('.'+ this.modalClass +' video').each(function(){
			this.pause();
			this.src = '';
			$(this).remove();
		});
	};
	Modal.prototype.hide = function(e){
		if(e) e.preventDefault();

		this.removeVideos();
		$('.'+ this.bgClass).removeClass(this.activeClass);
		$('.'+ this.modalClass).removeClass(this.activeClass).css({'height':'', 'margin-top':''}).find('.'+ this.contentClass).html('');
	};

	var _T = {
		cache: {},
		splitParamSymb: '_',
		delimStart: '{{',
		delimEnd: '}}',
		delimExecute: '#',
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
			var that = this,
				regExp_1 = new RegExp("((^|"+ this.delimEnd +")[^\t]*)'", 'g'),
				regExp_2 = new RegExp("\t"+ this.delimExecute +"(.*?)"+ this.delimEnd, 'g');
			try{
				var fn = !/\W/.test(str) ?
					this.cache[str] = this.cache[str] ||
					this.getT(document.getElementById(str).innerHTML) :

					new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +
					"with(obj){p.push('" +
					that.escape(str)
						.split(that.delimStart).join("\t")
						.replace(regExp_1, "$1\r")
						.replace(regExp_2, "',$1,'")
						.split("\t").join("');")
						.split(that.delimEnd).join("p.push('")
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
			var paramsRegExp = new RegExp(this.delimStart + this.delimExecute +'.*?'+ this.delimEnd, 'gm'),
				cleanParamName = new RegExp(this.delimStart + this.delimExecute +'\\s*|\\s*'+ this.delimEnd, 'g'),
				params = templString.match(paramsRegExp);

			//Return empty array in case there is no params in a string
			if(!params)
				return [];

			for(var i=0; i<params.length; i++)
				params[i] =  params[i].replace(cleanParamName, '');

			return params;
		},
		getTemplParamsObj: function(templString){
			var paramsArray = this.getTemplParamsNames(templString),
				paramsObj = {};

			for(var i=0; i<paramsArray.length; i++)
				paramsObj[paramsArray[i]] = '';

			return paramsObj;
		},
		updateTemplateParams: function(string){
			var that = this,
				regExp = new RegExp('(?:'+ this.delimStart + this.delimExecute +')(.*)?(?:'+ this.delimEnd +')', 'gm');

			return string.replace(regExp, function(match, g1){
				return that.delimStart + that.delimExecute +' ' + ($.trim(g1)).replace(/\s+/g, that.splitParamSymb) +' '+ that.delimEnd;
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
		this.confirmDelTemplClass = 'js-confirm-del';
		this.notDelTemplClass = 'js-cansel-del';
		this.confirmDelHolderClass = 'js-confirm-del-holder';
		this.templItemClass = 'js-templ-item';
		this.templAddClass = 'js-templ-action-add';
		this.templImportExportClass = 'js-import-export-btn';
		this.addTemlFormClass = 'js-add-form';
		this.applyTemplParamsFormClass = 'js-apply-params';
		this.saveDefaultsFormClass = 'js-save-default-params';
		this.commentAttr = 'data-comm';
		this.templNameAttr = 'data-templ-name';
		this.activeClass = 'active';

		this.exportTemplsBtnClass = 'js-export-templs';
		this.importTemplsBtnClass = 'js-import-templs';

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
	};
	Templates.prototype.initParams = function(params){
		for(var param in params){
			if (params.hasOwnProperty(param))
				this[param] = params[param];
		}
	};
	Templates.prototype.initAssociateParams = function(){
		//Set params based on another params
		this._templButton = '<div class="'+ this.templContainerClass +'" '+ this.commentAttr +'="{{# uniqueAttr }}">'+
								'<div class="'+ this.templListClass +'">'+
									'{{ if(! jQuery.isEmptyObject(templates) ){ }}'+
										'<ul>'+
											'{{ for(var key in templates){ }}'+
												'<li class="'+ this.templItemClass +'" '+ this.templNameAttr +'="{{# key }}">'+
													'<a class="'+ this.templItemLinkClass +' '+ this.applyTemplClass +'" href="#" title="Apply template item.">{{# key }}</a>'+
													'<span class="'+ this.confirmDelHolderClass +'">'+
														'<a href="#" class="'+ this.confirmDelTemplClass +'">Yes</a> | '+
														'<a href="#" class="'+ this.notDelTemplClass +'">No</a>'+
													'</span>'+
													'<span class="'+ this.templItemActionsClass +' '+ this.activeClass +'">'+
														'{{ if(!jQuery.isEmptyObject(defaults[key])){ }}'+
															'<a href="#" class="'+ this.confTemplClass +' aui-icon aui-icon-small aui-iconfont-configure" title="Configure default parameters in template.">conf</a> '+
														'{{ } }}'+
														'<a href="#" class="'+ this.editTemplClass +' aui-icon aui-icon-small aui-iconfont-edit" title="Edit template item.">edit</a> '+
														'<a href="#" class="'+ this.delTemplClass +' aui-icon aui-icon-small aui-iconfont-delete" title="Remove template item.">del</a>'+
													'</span>'+
												'</li>'+
											'{{ } }}'+
										'</ul>'+
									'{{ }else{ }}'+
										'<div class="'+ this.noTemplMsgClass +'">You dont have any templates yet.</div>'+
									'{{ } }}'+
									'<div class="add-templ-holder">'+
										'<a href="#" title="Add new template" class="'+ this.templAddClass +' aui-button small-btn">Add template</a>'+
										'<a href="#" title="Import/Export templates" class="'+ this.templImportExportClass +' aui-button small-btn">Import/Export</a>'+
									'</div>'+
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
								'<input class="templName" type="text" name="name" placeholder="Name of template" value="{{# name }}" required>'+
							'</h2>'+
							'<div class="jira-dialog-main-section">'+
								'<textarea class="locked" name="value" placeholder="Template" required>{{# templ }}</textarea>'+
							'</div>'+
							'<div class="buttons-container">'+
								'<input class="button" type="submit" value="Save">'+
							'</div>'+
						'</form>';
		this._confTeml = '<form class="'+ this.saveDefaultsFormClass +' aui">'+
							'<h2 class="jira-dialog-heading">Default parameters value for "{{# templName }}".</h2>'+
							'<div class="jira-dialog-main-section">'+
								'<ul class="defaults-list">'+
									'{{ for(var param in params){ }}'+
										'<li>'+
											'<label for="label-{{# param }}">{{# param }}:</label>'+
											'<textarea id="label-{{# param }}" class="locked" name="{{# param }}" placeholder="{{# param }}">'+
												'{{ if(params[param].length){ }}'+
													'{{# params[param] }}'+
												'{{ } }}'+
											'</textarea>'+
										'</li>'+
									'{{ } }}'+
								'</ul>'+
								'<input type="hidden" name="templName" value="{{# templName }}">'+
							'</div>'+
							'<div class="buttons-container">'+
								'<input class="button" type="submit" value="Save">'+
							'</div>'+
						'</form>';
		this._paramsDialog = '<form class="'+ this.applyTemplParamsFormClass +' aui">'+
								'<h2 class="jira-dialog-heading">Fill out parameters for template "{{# templName }}".</h2>'+
								'<div class="jira-dialog-main-section">'+
									'{{ for(var param in params){ }}'+
										'<textarea class="locked" name="{{# param }}" placeholder="{{# param }}">'+
											'{{ if(params[param]){ }}'+
												'{{# params[param] }}'+
											'{{ } }}'+
										'</textarea>'+
									'{{ } }}'+
									'<input type="hidden" name="templName" value="{{# templName }}">'+
								'</div>'+
								'<div class="buttons-container">'+
									'<input class="button" type="submit" value="Apply">'+
								'</div>'+
							'</form>';
		this._importExport = '<h2 class="jira-dialog-heading">Import/Export templates.</h2>'+
							'<div class="jira-dialog-main-section">'+
								'<div class="import-box">'+
									'<div class="import-btn-holder" title="Import templates">'+
										'<span class="import-btn-fallback aui-button small-btn">Import templates</span>'+
										'<input class="'+ this.importTemplsBtnClass +'" type="file">'+
									'</div>'+
								'</div>'+
								'<div class="export-box">'+
									'<a href="#" title="Export templates" class="'+ this.exportTemplsBtnClass +' aui-button small-btn">Export templates</a>'+
								'</div>'+
							'</div>';
	};
	Templates.prototype.init = function(){
		this.addDefaultTemplates();
		this.registerEvents();
		this.addCustomStyles();
		this.addTemplBtns();
	};
	Templates.prototype.log = function(msg){
		if(this.isLog)
			console.info(msg);
	};
	Templates.prototype.registerEvents = function(){
		//Init templates on mouse hover on textarea
		$(document).on('mouseenter', this.commentSel +':not(['+ this.commentAttr +']):not(.locked)', $.proxy(this, 'addTemplBtn'))

					//Add template link (open modal dialog with form)
					.on('click', '.'+ this.templAddClass, $.proxy(this.openAddTemplModal, this))

					//Import/Export template btn (open modal dialog with form)
					.on('click', '.'+ this.templImportExportClass, $.proxy(this.openImportExportModal, this))

					//Export templates
					.on('click', '.'+ this.exportTemplsBtnClass, $.proxy(this.exportTempls, this))

					//Importtemplates
					.on('change', '.'+ this.importTemplsBtnClass, $.proxy(this.getFile, this))

					//Add template handler
					.on('submit', '.'+ this.addTemlFormClass, $.proxy(this.addTempl, this))

					//Apply template params handler
					.on('submit', '.'+ this.applyTemplParamsFormClass, $.proxy(this.onApplyParams, this))

					//Apply template default parameters hendler
					.on('submit', '.'+ this.saveDefaultsFormClass, $.proxy(this.onSaveDefaults, this))

					//Apply template item
					.on('click', '.'+ this.applyTemplClass, $.proxy(this.onApplyTemplItem, this))

					//Edit template item
					.on('click', '.'+ this.editTemplClass, $.proxy(this.onEditTemplItem, this))

					//Show confirm for removing template item
					.on('click', '.'+ this.delTemplClass, $.proxy(this.showConfirm, this))

					//Hide confirm for removing template item
					.on('click', '.'+ this.notDelTemplClass, $.proxy(this.hideConfirm, this))

					//Remove template item
					.on('click', '.'+ this.confirmDelTemplClass, $.proxy(this.onDelTemplItem, this))

					//Config default params for template item
					.on('click', '.'+ this.confTemplClass, $.proxy(this.onConfTemplItem, this))

					//Show/hide template options
					.on('mouseenter', '.'+ this.templContainerClass, $.proxy(this.showOptions, this))
					.on('mouseleave', '.'+ this.templContainerClass, $.proxy(this.hideOptions, this));
	};

	Templates.prototype.addCustomStyles = function(){
		var $styles = $("<style/>").html(
			'.'+ this.templContainerClass +'{position:absolute; margin-top:-12px; z-index:999;}'+
			'.'+ this.templContainerClass +'.active{z-index:9999;}'+
			'.'+ this.templContainerClass +' a{color:#FFF;}'+
			'.'+ this.templContainerClass +':before{content:""; width:30px; height:12px; display:block; background:#3B73AF; border-radius:50% 50% 0 0; cursor:pointer}'+
			'.'+ this.templListClass +'{z-index:1; position:absolute; left:0; top:12px; width:250px; padding:10px; background:#3B73AF; color:#FFF; border-radius:0 5px 5px;transition:all 0.2s ease-in-out; display: none;}'+
			'body .'+ this.templListClass +' ul{margin:0; padding:0;}'+
			'.'+ this.templAddClass +'{display:block; text-align:center; margin-top:10px;}'+
			'.'+ this.noTemplMsgClass +'{text-align:center}'+
			'.'+ this.templContainerClass +'.active .'+ this.templListClass +'{display: block;}'+
			'.jira-dialog-main-section {padding: 5px 10px 0;}'+
			'.jira-dialog-main-section textarea {width: 100%; max-width: 100%; margin-bottom: 5px; display:block; padding:1%; box-sizing:border-box;}'+
			'.templName {border-width:0 0 1px; border-color:#000; font-size:20px; background:transparent; color:#333; width:200px;}'+
			'.'+ this.addTemlFormClass +' textarea{height: 300px}'+
			'.'+ this.templItemLinkClass +',.'+ this.templItemActionsClass +'{display: inline-block; vertical-align: top;}'+
			'.'+ this.templItemLinkClass +'{max-width: 73%; float:left;}'+
			'.'+ this.templItemActionsClass +',.'+ this.confirmDelHolderClass +'{text-align:right; float:right; white-space:nowrap; overflow:hidden; transition:width 0.2s ease-in-out; width: 0;}'+
			'.'+ this.templItemActionsClass + '.'+ this.activeClass +',.'+ this.confirmDelHolderClass +'.'+ this.activeClass +'{width: 25%;}'+
			'.defaults-list{padding:0; list-style-type:none;}'+
			'.defaults-list li{overflow: hidden;}'+
			'.defaults-list label{float:left; width:28%; padding-right:2%; text-align:right; word-break:break-all;}'+
			'.defaults-list textarea{float:left; width:70%; max-width:70%;}'+
			'.'+ this.templItemActionsClass +' .'+ this.delTemplClass +'{color:#FF887F;}'+
			'.'+ this.templItemActionsClass +' .'+ this.editTemplClass +'{color: #64FD6A;}'+
			'.'+ this.templItemClass +'{border-top:1px solid transparent; border-bottom:1px solid transparent; overflow: hidden; padding: 0 2px;}'+
			'.'+ this.templItemClass +':hover{border-color:#fff;}'+
			'.'+ this.templItemClass +' a{text-decoration:none;}'+
			'.'+ this.templItemClass +' a:hover{text-shadow:0 0 1px #FFF;}'+
			'.aui-button.small-btn{height:auto; padding:2px 5px; color:#000; background:#fff;}' +
			'.add-templ-holder{text-align:center; border-top:1px solid #CCC; padding-top:10px; margin-top:10px;}'+
			'.export-box, .import-box{width:50%; display:inline-block; vertical-align:top; box-sizing:border-box; padding:25px 10px; margin-bottom:5px;}'+
			'.import-box{border-right:1px solid #CCC;}'+
			'.'+ this.importTemplsBtnClass +'{width:100%;}'+
			'.import-btn-holder:hover .import-btn-fallback{background:#e9e9e9; border-color:#999;}'+
			'.import-btn-holder{position:relative; display:inline-block; overflow:hidden;}'+
			'.'+ this.importTemplsBtnClass +'{position:absolute; width:300%; top:0; right:0; font-size:25px; opacity:0; cursor:pointer;}'
		);

		this.$head.append($styles);
	};
	Templates.prototype.addDefaultTemplates = function(){
		var isNoSavedTempls = $.isEmptyObject(this.getSavedTempls());

		if(isNoSavedTempls){
			for(var templ in this.defaultTempls)
				this.saveTempl(templ, this.defaultTempls[templ]);
		}
	};
	Templates.prototype.addTemplBtns = function(){
		var that = this;

		$(this.commentSel +':not(['+ this.commentAttr +']):not(.locked)').each(function(){
			that.addTemplBtn({currentTarget: this});
		});
	};
	Templates.prototype.addTemplBtn = function(e){
		var $this = $(e.currentTarget),
			uniqueAttr = 'c-'+ new Date().getTime(),
			templButton = this.getTemplButton(uniqueAttr);

		$this.attr(this.commentAttr, uniqueAttr);
		$(templButton).insertBefore(e.currentTarget);
	};
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
	};
	Templates.prototype.onEditTemplItem = function(e){
		e.preventDefault();
		var templName = this.getTemplNameFromParent(e),
			templ = this.getTemlByName(templName);

		this.hideOptions();

		modal.show(_T.getT(this._editTeml, {
			name: templName,
			templ: templ
		}));
	};
	Templates.prototype.showConfirm = function(e){
		e.preventDefault();
		var $this = $(e.currentTarget),
			$templItem = $this.closest('.'+ this.templItemClass),
			$templItemActions = $templItem.find('.'+ this.templItemActionsClass),
			$confirmHolder = $templItem.find('.'+ this.confirmDelHolderClass);

		$templItemActions.removeClass(this.activeClass);
		$confirmHolder.addClass(this.activeClass);
	};
	Templates.prototype.hideConfirm = function(e){
		e.preventDefault();
		var $this = $(e.currentTarget),
			$templItem = $this.closest('.'+ this.templItemClass),
			$templItemActions = $templItem.find('.'+ this.templItemActionsClass),
			$confirmHolder = $templItem.find('.'+ this.confirmDelHolderClass);

		$templItemActions.addClass(this.activeClass);
		$confirmHolder.removeClass(this.activeClass);
	};
	Templates.prototype.onDelTemplItem = function(e){
		e.preventDefault();
		var templName = this.getTemplNameFromParent(e);

		this.delTempl(templName);
	};
	Templates.prototype.onConfTemplItem = function(e){
		e.preventDefault();
		var templName = this.getTemplNameFromParent(e),
			templParams = this.getTemplDefaults(templName);

		this.hideOptions();

		modal.show(_T.getT(this._confTeml, {
			templName: templName,
			params: templParams
		}));
	};
	Templates.prototype.onSaveDefaults = function(e){
		e.preventDefault();
		var $this = $(e.currentTarget),
			data = $this.serializeObject(),
			templName = data.templName;

		delete data.templName;
		this.saveTemplDefaults(templName, data);
	};
	Templates.prototype.onApplyParams = function(e){
		e.preventDefault();
		var $this = $(e.currentTarget),
			data = $this.serializeObject();

		this.applyTempl(data.templName, data);
		modal.hide();
	};
	Templates.prototype.applyTempl = function(templName, data){
		var that = this,
            data = data ? data : {},
			templ = that.getTemlByName(templName),
			oldValue = that.$activeComment.val();

		that.$activeComment.val(oldValue + _T.getT(templ, data));
        setTimeout(function(){
            that.$activeComment.focus();
        }, 100);
	};
	Templates.prototype.showOptions = function(e){
		var $this = $(e.currentTarget),
			commentId = $this.attr(this.commentAttr);

		$this.addClass('active');
		this.$activeComment = $(this.commentSel +'['+ this.commentAttr +'="'+ commentId +'"]');
	};
	Templates.prototype.hideOptions = function(e){
		$('.'+ this.templContainerClass).removeClass('active');
	};
	Templates.prototype.getTemplNameFromParent = function(e){
		var $this = $(e.currentTarget),
			$templItem = $this.closest('.'+ this.templItemClass);

		return $templItem.attr(this.templNameAttr);
	};
	Templates.prototype.getTemlByName = function(name){
		return this.getSavedTempls()[name];
	};
	Templates.prototype.getSavedTempls = function(){
		var templs = GM_getValue('templates');
		return typeof templs != 'undefined' ? JSON.parse(templs) : {};
	};
	Templates.prototype.getSavedDefaults = function(){
		var defaults = GM_getValue('templ-defaults');
		return typeof defaults != 'undefined' ? JSON.parse(defaults) : {};
	};
	Templates.prototype.getTemplDefaults = function(name){
		return this.getSavedDefaults()[name];
	};
	Templates.prototype.getTemplButton = function(uniqueAttr){
		var data = {
			templates: this.getSavedTempls(),
			defaults: this.getSavedDefaults(),
			uniqueAttr: uniqueAttr
		};
		return _T.getT(this._templButton, data);
	};
	Templates.prototype.getCurDate = function(){
		var today = new Date(),
			dd = today.getDate(),
			mm = today.getMonth()+1,
			yyyy = today.getFullYear();

		dd = dd<10 ? '0'+dd : dd;
		mm = mm<10 ? '0'+mm : mm;

		return dd+'.'+mm+'.'+yyyy;
	};
	Templates.prototype.openAddTemplModal = function(e){
		e.preventDefault();

		modal.show(this._newTeml);
	};
	Templates.prototype.openImportExportModal = function(e){
		e.preventDefault();

		modal.show(this._importExport);
	};
	Templates.prototype.addTempl = function(e){
		e.preventDefault();
		var $this = $(e.currentTarget),
			data = $this.serializeObject(),
			templName = ($.trim(data.name)).replace(/\s/g, '_'),
			templString = _T.updateTemplateParams(data.value);

		this.saveTempl(templName, templString);
		this.refreshButtons();
	};
	Templates.prototype.showParamsDialog = function(templName, params){
		var data = {
			templName: templName,
			params: params
		};
		modal.show(_T.getT(this._paramsDialog, data));
	};
	Templates.prototype.delTempl = function(templName){
		var savedTempl = this.getSavedTempls();

		delete savedTempl[templName];

		GM_setValue('templates', JSON.stringify(savedTempl));

		this.delDefaults(templName);
		this.refreshButtons();
	};
	Templates.prototype.delDefaults = function(templName){
		var defaults = this.getSavedDefaults();

		delete defaults[templName];

		GM_setValue('templ-defaults', JSON.stringify(defaults));
	};
	Templates.prototype.saveTemplDefaults = function(templName, params){
		var allDefaults = this.getSavedDefaults(),
			defaults = allDefaults[templName];

		if(!$.isEmptyObject(defaults)){
			for(var param in params)
				defaults[param] = params[param];
		}
		else{
			allDefaults[templName] = params;
		}

		GM_setValue('templ-defaults', JSON.stringify(allDefaults));

		modal.hide();
	};
	Templates.prototype.saveTempl = function(templName, templString){
		var savedTempls = this.getSavedTempls(),
			paramsObj = _T.getTemplParamsObj(templString);

		//Save dafaults if parameters object is not empty
		if(!$.isEmptyObject(paramsObj))
			this.saveTemplDefaults(templName, paramsObj);

		savedTempls[templName] = templString;

		GM_setValue('templates', JSON.stringify(savedTempls));

		modal.hide();
	};
	Templates.prototype.exportTempls = function(e){
		e.preventDefault();
		var today = this.getCurDate(),
			data = {
				templates: this.getSavedTempls(),
				defaults: this.getSavedDefaults()
			};

		var blob = new Blob([JSON.stringify(data)],{
			type: 'text/plain;charset=utf-8'
		});

		saveAs(blob, 'Templates_'+ today +'.json');
	};
	Templates.prototype.importTempls = function(fileName, string){
		try{
			var data = JSON.parse(string);

			//Save templates
			for(var templ in data.templates)
				this.saveTempl(templ, data.templates[templ]);

			//Save defaults
			for(var defaultsItem in data.defaults)
				this.saveTemplDefaults(defaultsItem, data.defaults[defaultsItem]);

			this.refreshButtons();
		}
		catch(e){
			alert('Error in reading "'+ fileName +'"!');
		}
	};
	Templates.prototype.getFile = function(e){
		e.preventDefault();
		var that = this,
			input = e.currentTarget,
			file = input.files[0],
			reader = new FileReader();

		reader.addEventListener("load", function(event) {
			that.importTempls(file.name, event.target.result);
			input.value = null;
		});
		reader.readAsText(file);
	};
	Templates.prototype.removeButtons = function(){
		$('.'+ this.templContainerClass).remove();
		$('.'+ this.commentSel).attr(this.commentAttr, null);
	};
	Templates.prototype.refreshButtons = function(){
		this.removeButtons();
		this.addTemplBtns();
	};
	var modal = new Modal();
	var templates = new Templates({
		defaultTempls: {
			Send_to_review: 'Hi {{# reviewer_name }},\n\n'+
							'Please review the code.\n\n'+
							'Thanks in advance.',
			Code_approved: 'Code looks good.\n'+
							'No comments or objections.',
			Implemented: '{{# implemented_stuff }} has been implemented.'
		}
	});
}
catch(e){
	console.error(e);
}

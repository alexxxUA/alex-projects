function Navigation(param){
	var defaults = {
		dynContSelector: '#dynamicContent',
		loaderSelector: '#loading',
		link: '.js-dynamicReload',
		reloads: 0
	};
	param = param ? param : defaults;

	//Init properties
	for(key in defaults) if(defaults.hasOwnProperty(key)){
		this[key] = param[key] ? param[key] : defaults[key];
	}

	this.init();
}
Navigation.prototype.init = function(){
	this.registerEvents();
}
Navigation.prototype.registerEvents = function(){
	var that = this;

	$(document).on('click', that.link, function(e){
		e.preventDefault();
		var url = $(this).attr('href');

		that.loadDom(url);
		that.pushUrl2History(url);
	});

	$(window).bind('popstate', function() {
		if(that.reloads == 0) return;
		that.loadDom(location.pathname);
	});
}
//Refresh the page
Navigation.prototype.refreshPage = function(){
	this.loadDom(location.pathname);
}
//Change the browser's URL to the given link location
Navigation.prototype.pushUrl2History = function(url){
	if(url!=window.location)
		window.history.pushState({path:url},'',url);
}
//Ajax loader
Navigation.prototype.getLoaderPos = function(e){
	var yPosLoad = e.pageY+7,
		xPosLoad = e.pageX+7;
	$(this.loaderSelector).css({'top' : yPosLoad+17, 'left' : xPosLoad+17, 'display' : 'block'});
}
Navigation.prototype.showLoader = function(){
	var that = this;

	$(window).on('mousemove', function(e){
		that.getLoaderPos(e);
	});
}
Navigation.prototype.hideLoader = function(){
	$(window).off('mousemove');
	$(this.loaderSelector).css('display', 'none');
}
Navigation.prototype.loadDom = function(url){
	var that = this;

	that.showLoader();

	$.ajax({
		url:url,
		data: {reload: 'true'},
		success: function(data){
			that.reloads += 1;
			that.hideLoader();
			$(that.dynContSelector).html(data);
		}
	});
}

function FileExplorer(param){
	var defaults = {
			dropZone: 'body',
			uploadSection: '.js-upload-section',
			overalProg: '.js-overal-progress',
			overalName: '.js-overal-name',
			overalVal: '.js-overal-value',
			fileList: '.js-file-list',
			fileItem: '.js-file-item',
			fileItemName: '.js-file-item-name',
			fileItemProg: '.js-file-item-progress',
			rLink: '.js-dynamicReload',

			contextArea: '.js-context-area',
			contextLink: '.js-link-operations',
			fileName: '.js-file-name',
			contextMenu: '.js-context-menu',
			contextDropDown: '.js-context-dropdown',
			contextItem: '.js-context-item',
			contextActionList: '.js-context-action-list',
			contextActionListItem: '.js-context-action',
			cancelActionLink: '.js-action-cancel',
			hideUploadWindow: '.js-hide-upload',
			downloadActionLink: '.js-download'
		};
	param = param ? param : defaults;
	this.allFiles = [];
	this.overalSize = 0;
	this.uploadedSize = 0;

	//Init properties
	for(key in defaults) if(defaults.hasOwnProperty(key)){
		this[key] = param[key] ? param[key] : defaults[key];
	}

	this.init();
}
FileExplorer.prototype.init = function(){
	this.registerEvents();
}
FileExplorer.prototype.registerEvents = function(){
	var that = this,
		$dropZone = $(that.dropZone);

	//Hover efect
	$dropZone[0].ondragover = function(e){
		that.onDragMove(e);
		return false;
	}
	$dropZone[0].ondragleave = function(e){
		if(e.pageX == 0)
			that.onDragEnd();
		return false;
	}
	//On drop files
	$dropZone[0].ondrop = function(e) {
		e.preventDefault();
		that.onDragEnd();
		that.fileDroped(e);
	};

	//Hide context menu
	$(document).on('click', 'body', function(e){
		var $menu = that.getNodeByE(e, that.contextMenu);

		if($menu.length == 0)
			that.hideContextMenu();
	});

	//Show context menu
	$(document).on('contextmenu', that.contextArea, function(e){
		e.preventDefault();

		that.hideContextMenu();
		that.showContextMenu(e);
	});

	//Select file action link
	$(document).on('click', that.contextItem, function(e){
		e.preventDefault();
		that.showActionContainer(e);
	});

	//Cancel file action
	$(document).on('click', that.cancelActionLink, function(e){
		e.preventDefault();
		that.cancelAction();
	});

	$(document).on('click', that.downloadActionLink, $.proxy(that.hideContextMenu, that));
	$(document).on('click', that.hideUploadWindow, $.proxy(that.hideUploadSection, that));
}
FileExplorer.prototype.onDragMove = function(e){
	var $link = this.getNodeByE(e, this.rLink);

	this.onDragEnd();

	if($link[0])
		$link.addClass('on-drag-over');
	else
		$(this.dropZone).addClass('on-drag-over');
}
FileExplorer.prototype.onDragEnd = function(){
	$('.on-drag-over').removeClass('on-drag-over');
}
FileExplorer.prototype.getNodeByE = function(e, selector){
	var $target = $(e.target || e.srcElement),
		$node = $target.hasClass(selector.substring(1)) ? $target : $target.closest(selector);

	return $node;
}
FileExplorer.prototype.fileDroped = function(e){
	var that = this,
		files = e.dataTransfer.files,
		$link = that.getNodeByE(e, that.rLink);;
		path = $link.length > 0 ? $link[0].pathname : window.location.pathname,
		isPrevUploaded = true;

	//Add path var to each file
	that.appendObject2Array(files, {'path': path});
	//Store main file array
	that.allFiles.push.apply(that.allFiles, files);
	//Check if all previous files were uploaded
	isPrevUploaded = that.overalSize ==  that.uploadedSize ? true : false;
	//Update overal size
	that.overalSize += that.calculateSize(files);
	//Append files to the upload section
	that.setFiles2Template(files);

	if(isPrevUploaded){
		that.updateMainProgInfo(files[0]);
		that.uploadFile(files[0]);
	}

	$(that.dropZone).removeClass('file-hover').addClass('file-drop');
	that.showUploadSection();
}
FileExplorer.prototype.showUploadSection = function(){
	$(this.uploadSection).removeClass('panel-hide');
}
FileExplorer.prototype.hideUploadSection = function(){
	$(this.uploadSection).addClass('panel-hide');
}
FileExplorer.prototype.appendObject2Array = function(array, object){
	for(var i=0; array.length > i; i++){
		for(key in object) if(object.hasOwnProperty(key)){
			array[i][key] = object[key];
		}
	}
}
FileExplorer.prototype.calculateSize = function(files){
	var size = 0;
	for(var i=0; files.length > i; i++)
		size += files[i].size;

	return size;
}
FileExplorer.prototype.getFileItemTemplate = function(file){
	return '<li class="list-group-item '+ this.fileItem.substring(1) +'">'+
				'<span title="'+ file.name +'" class="'+ this.fileItemName.substring(1) +'">'+ file.name +'</span>'+
				'<div class="progress">'+
					'<div role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" class="progress-bar progress-bar-info progress-bar-striped '+ this.fileItemProg.substring(1) +'">0%</div>'+
				'</div>'+
			'</li>';
}
FileExplorer.prototype.updateMainProgInfo = function(file){
	$(this.overalName).html(file.name);
	$(this.overalVal).html(this.allFiles.indexOf(file)+1 +'/'+ this.allFiles.length);
	this.updateProg($(this.overalProg), this.uploadedSize / this.overalSize * 100);
}
FileExplorer.prototype.setFiles2Template = function(files){
	var $fileList = $(this.fileList),
		htmlFiles = '';

	for(var i=0; files.length > i; i++){
		htmlFiles += this.getFileItemTemplate(files[i]);
	}
	$fileList.append(htmlFiles);
}
FileExplorer.prototype.uploadFile = function(file){
	var that = this,
		$file = $($(that.fileItem)[that.allFiles.indexOf(file)]),
		xhr = new XMLHttpRequest();

	xhr.upload.addEventListener('progress', function(e){
		var percent = e.loaded / e.total * 100,
			$progBar = $file.find(that.fileItemProg);

		that.updateProg($progBar, percent);
	}, false);

	xhr.onreadystatechange = function(e){
		that.readyFileStatus(file, $file, e);
	};
	xhr.open('POST', '/upload');
	xhr.setRequestHeader('X-FILE-NAME', encodeURIComponent(file.name));
	xhr.setRequestHeader('X-FILE-PATH', file.path);
	xhr.send(file);
}
FileExplorer.prototype.updateProg = function($progBar, percent){
	 var percent = parseInt(percent);
	 $progBar.width(percent +'%').html(percent +'%');
}
FileExplorer.prototype.readyFileStatus = function(file, $file, e){
	if (e.target.readyState == 4) {
		var curIndex = this.allFiles.indexOf(file),
			nextFile = this.allFiles[curIndex+1];

		if (e.target.status == 200) {
			$file.addClass('list-group-item-success');
		} else {
			$file.addClass('list-group-item-danger');
		}

		//Update upload size
		this.uploadedSize += file.size;

		//Refresh page
		navigation.refreshPage();

		//Upload next
		if(nextFile){
			this.uploadFile(nextFile);
			this.updateMainProgInfo(nextFile);
		}
		else{
			this.updateMainProgInfo(file);
		}
	}
}
FileExplorer.prototype.showContextMenu = function(e){
	var that = this,
		$menu = $(that.contextMenu),
		$link = that.getNodeByE(e, that.contextLink),
		actionTypes = $link[0] ? $link.data('action-types').split(' ') : ['create'],
		pos = {},
		fileData = {};

	//Enable action links in context dropdown
	that.showContextActionLinks(actionTypes);
	//Get visible position of dropdown
	pos = that.getVisiblePos(e, that.contextDropDown);

	if($link[0]){
		fileData = that.getFileData($link);
		$menu[0].$link = $link;

		//Add active class to link
		$link.addClass('active');
	}
	else{
		fileData.oldPath = location.pathname;
	}

	//Paste data to the context menu
	Tmpl.updateContextWithData($menu, fileData);

	//Show context menu
	$menu.addClass('visible').css({
		'top': pos.y,
		'left': pos.x
	});
}
FileExplorer.prototype.getVisiblePos = function(e, selector){
	var $node = $(selector),
		nodeH = $node.height(),
		nodeW = $node.width(),
		nodeY = e.pageY + nodeH >= $(document).height() ? $(document).height() - nodeH - 20 : e.pageY,
		nodeX = e.pageX + nodeW >= $(document).width() ? $(document).width() - nodeW - 20 : e.pageX;

	return {y: nodeY, x: nodeX};
}
FileExplorer.prototype.hideContextMenu = function(e){
	//Remove active class from link
	$(this.contextLink).removeClass('active');

	//Hide context menu
	$(this.contextMenu).removeClass('visible').css({top: '', left: ''});
	this.cancelAction();
	this.hideContextActionLinks();
}
FileExplorer.prototype.showContextActionLinks = function(actionTypes){
	for(var i=0; i<actionTypes.length; i++){
		$(this.contextItem +'[data-action="'+ actionTypes[i] +'"]').removeClass('hide');
	}
}
FileExplorer.prototype.hideContextActionLinks = function(){
	$(this.contextItem).addClass('hide');
}
FileExplorer.prototype.showActionContainer = function(e){
	var actionType = $(e.target).data('action'),
		$contextActionContainer = $(this.contextActionList).find(this.contextActionListItem +'[data-action="'+ actionType +'"]'),
		$menu = $(this.contextMenu),
		pos = {
			pageX: $menu[0].offsetLeft,
			pageY: $menu[0].offsetTop
		},
		visiblePos = {};

	$(this.contextDropDown).addClass('fade-out');
	$contextActionContainer.addClass('fade-in');

	//Update context menu position
	visiblePos = this.getVisiblePos(pos, $contextActionContainer);
	$menu.css({
		'top': visiblePos.y,
		'left': visiblePos.x
	});
}
FileExplorer.prototype.cancelAction = function(){
	$(this.contextDropDown).removeClass('fade-out');
	$(this.contextActionList).find(this.contextActionListItem).removeClass('fade-in');

	//Remove error messages
	Validator.removeAllErrors($(this.contextActionList));
}
FileExplorer.prototype.getFileData = function($node){
	var fileData = {},
		isFile = $node.data('type') == 'file' ? true : false,
		pathArray = decodeURI($node[0].pathname).split('/'),
		path = isFile ? pathArray.slice(0, pathArray.length-1) : pathArray.slice(0, pathArray.length-2);

	fileData.oldPath = path.join('/') + '/';
	fileData.oldName = $node.find(this.fileName).text();
	fileData.fullPath = fileData.oldPath + fileData.oldName;
	fileData.isFile = isFile;

	return fileData;
}
FileExplorer.prototype.created = function(request, $form){
	navigation.refreshPage();
	fileExplorer.hideContextMenu();
}
FileExplorer.prototype.renamed = function(request, $form){
	navigation.refreshPage();
	fileExplorer.hideContextMenu();
}
FileExplorer.prototype.deleted = function(request, $form){
	navigation.refreshPage();
	fileExplorer.hideContextMenu();
}


var Tmpl = {
    cache: {},
    getT: function(str, data){
        try{
            var fn = !/\W/.test(str) ?
                this.cache[str] = this.cache[str] ||
                this.getT(document.getElementById(str).innerHTML) :

                new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +
                "with(obj){p.push('" +
                str
                    .replace(/[\r\t\n]/g, " ")
                    .split("<%").join("\t")
                    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                    .replace(/\t=(.*?)%>/g, "',$1,'")
                    .split("\t").join("');")
                    .split("%>").join("p.push('")
                    .split("\r").join("\\'")
                    + "');}return p.join('');");

            return data ? fn( data ) : fn;
        }
        catch(e){
            console.error(e.message /* + '\n' + e.stack*/);
            return '';
        }
    },
    updateContextWithData: function($context, dataObj){
        var that = this,
            $params = $context.find('[dyn-obj-prop], [dyn-template]');

        function updateSection($section){
            var dynName = $section.attr('dyn-obj-prop'),
                dynTemplate = $section.attr('dyn-template'),
                dynAttrChange = $section.attr('dyn-attr'),
                content = dataObj[dynName];

            if(typeof content !== 'undefined'){
                //Update element's attribute
                if(typeof dynAttrChange !== 'undefined'){
                    $section.attr(dynAttrChange, content);
                }
                //Update element's(input, textarea) value
                else if($section[0].tagName == 'INPUT' || $section[0].tagName == 'TEXTAREA'){
                    $section.val(content);
                }
                //Update element's inner html with template or without it
                else{
                    if(typeof dynTemplate !== 'undefined' && typeof that[dynTemplate] != 'undefined'){
                        var data = {};
                        data[dynName] = content;
                        content = that.getT(that[dynTemplate], data);
                    }
                    $section.html(content);
                }
            }
            else if( (typeof dynName == 'undefined' || dynName == '') && typeof dynTemplate !== 'undefined' && typeof that[dynTemplate] != 'undefined'){
                $section.html(that.getT(that[dynTemplate], {}));
            }
        }

        updateSection($context);
        $params.each(function(){
            updateSection(jQuery(this));
        });
    }
}


var Validator = {
	fieldClass: 'form-group',
	errorClass: 'data-error',
	errorMessageClass: 'error-message',
	errorMessageTemplate: _.template('<div class="<%= errorMessageClass %>"><div class="arrow"></div><div class="error-message-content"><%= error %></div></div>'),
	init: function(){
		this.registerEvents();
	},
	registerEvents: function(){
		var obj = this;
		$(document).delegate('[data-validate-type]', 'blur', $.proxy(obj, 'validate'));
	},
	valRegExps: {
		numb: /^\b\d+\b$/i,
		floatNumb: /^\b[0-9]*\.?[0-9]{1,2}\b$/i,
		notEmpty: /\S+/,
		email: /^\b[0-9A-Z_\.]+@[0-9A-Z]+\.[A-Z]{2,4}\b$/i
	},
	/*valRules: {
		attrVal: function(e, data, obj){
			return data.attrVal == data.checkValue ? true : false;
		}
	},*/
	errorMessages:{
		numb: _.template('Значення повинне бути цілим числом.'),
		floatNumb: _.template('Значення повинне бути числом.'),
		notEmpty: _.template('Поле є обов‘язковим для заповнення.'),
		email: _.template('Email повинен бути в форматі: aaa@aaa.aa .')
	},
	validate: function(e){
		var obj = this,
			$this = $(e.currentTarget);
			data = {
				validatorType: $this.attr('data-validate-type').split(' '),
				checkValue: $this.val()
			};

		obj.hideFieldErrors(e);

		if(data.validatorType.length){
			for(var i=0; i < data.validatorType.length; i++){
				var isValid = true;

				if(typeof obj.valRegExps[data.validatorType[i]] !== 'undefined'){
					if((obj.valRegExps[data.validatorType[i]]).test(data.checkValue))
						isValid = true;
					else
						isValid = false;
				}
				else if(typeof obj.valRules[data.validatorType[i]] !== 'undefined'){
					if(obj.valRules[data.validatorType[i]](e, data, obj))
						isValid = true;
					else
						isValid = false;
				}
				else{
					console.log('Validator rule exist');
				}

				if(isValid == false){
					obj.showError(e, data, data.validatorType[i]);
					obj.showBaseError(e);
					break;
				}
			}
		}
	},
	showErrorMessage: function(e, data, validatorType){
		var targetWidth = $(e.currentTarget).outerWidth(),
			$closestField = $(e.currentTarget).closest('.'+ this.fieldClass),
			message = this.errorMessages[validatorType](data),
			$message = $(this.errorMessageTemplate({errorMessageClass: this.errorMessageClass, error: message}));

		$message.css({'max-width': targetWidth});
		$closestField.append($message);
		$message.css({'top': -$message.outerHeight(), visibility: 'visible'});
	},
	showBaseError: function(e){
		var $this = $(e.currentTarget);
		$this.closest('.'+ this.fieldClass).addClass(this.errorClass);
	},
	hideBaseError: function(e){
		var $this = $(e.currentTarget);
		$this.closest('.'+ this.fieldClass).removeClass(this.errorClass);
	},
	showError: function(e, data, validatorType){
		var $this = $(e.currentTarget);
		$this.closest('.'+ this.fieldClass).addClass(this.errorClass +'-'+validatorType);
		this.showErrorMessage(e, data, validatorType);
	},
	hideFieldErrors: function(e){
		var $this = $(e.currentTarget),
			$closestField = $this.closest('.'+ this.fieldClass);
		$closestField.removeClass(function(index, css){
			return ( css.match(/data-error\S*/g) || []).join(' ');
		});
		$closestField.find('.'+ this.errorMessageClass).remove();
		this.hideBaseError(e);
	},
	removeAllErrors: function($context){
		$context.find(':regex(class, data-error.*)').removeClass(function(index, css){
			return ( css.match(/data-error\S*/g) || []).join(' ');
		});
		$context.find('.'+ this.errorMessageClass).remove();
	}
}

//RegExp selector
jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ? matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}

//Execute function from string
function executeFunctionByName(functionName, context , args) {
	var args = [].slice.call(arguments).splice(2),
		namespaces = functionName.split("."),
		func = namespaces.pop();
	for(var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
	}
	return context[func].apply(this, args);
}

//Ajax form submit abort
$(document).delegate('form[ajax="true"]', 'submit', function(e){
	e.preventDefault();

	var $form = $(this),
		formAction = $form.attr('action'),
		formData = $form.serialize(),
		formBeforeSend = $form.attr('ajax-before'),
		formSuccess = $form.attr('ajax-success'),
		formError = $form.attr('ajax-err');

	$form.find('[data-validate-type]').trigger('focusout');

	var formErrors = $form.find(':regex(class, data-error.*)');
	if(formErrors.length > 0){
		console.log('Detected form errors!!');
		return false;
	}

	$.ajax({
		type: "GET",
		url: formAction,
		data: formData,
		beforeSend: function(xhr, opts){
			navigation.showLoader();
			if(typeof formBeforeSend !== 'undefined' && formBeforeSend.length)
				executeFunctionByName(formBeforeSend, window, xhr, opts, $form);
		},
		success: function(request) {
			navigation.hideLoader();
			if(typeof formSuccess !== 'undefined' && formSuccess.length)
				executeFunctionByName(formSuccess, window, request, $form);
		},
		error: function(err){
			if(typeof formError !== 'undefined' && formError.length)
				executeFunctionByName(formError, window, request, $form);
			navigation.hideLoader();
			console.log(err);
		}
	});
});

var navigation = new Navigation();
var fileExplorer = new FileExplorer();
Validator.init();
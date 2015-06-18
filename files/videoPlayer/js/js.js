//Extend class
var Class = {
	ext: function(targetClass, sourse){
		if(Object.prototype.toString.call(sourse) === '[object Array]')
			this.arraySourse(targetClass, sourse);
		else
			this.objSourse(targetClass, sourse);
	},
	arraySourse: function(targetClass, sourse){
		for(var i=0; i<sourse.length; i++)
			this.objSourse(targetClass, sourse[i]);
	},
	objSourse: function(targetClass, sourse){
		for(var key in sourse) if(sourse.hasOwnProperty(key))
			targetClass[key] = sourse[key];			
	}
};

//classSelector
var dClass = {
	hasClass: function(target, cls){
		return (' '+ target.className +' ').indexOf(' '+ cls +' ') > -1
	},
	removeClass: function(target, cls){
		var reg = new RegExp('(\\s+|^)'+ cls +'(\\s+|$)', "g");
		
		target.className = target.className.replace(reg, '');
	},
	addClass: function(target, cls){
		target.className += ' '+ cls;
	}
}

function VideoControls(param){
    this.defaultParams = {
        videoSelector: '.custom-player',
        autoplay: false,
        volume: 100,
        startFrom: 0,
		wrapC: 'videoWrapper',
		vControlsC: 'vControls',
		vTimeC: 'vTime',
		vPlayPauseC: 'vPlayPause',
		vPlayC: 'vPlay',
		vPauseC: 'vPause',
		vStreamC: 'vStream',
		vVolC: 'vVol',
		vVolSlidderC: 'vVolSlidder',
		vFullScreanC: 'vFullScreen',
		vAnimationC: 'vAnimation'
    };
	this.updateInerval;    
    this.init(param);
};

Class.ext(VideoControls.prototype, {
    init: function(param){        
        //Init custom parameters
        var defaultParams = this.defaultParams;        
        for(var key in defaultParams)
            this[key] = param && param[key] ? param[key] : defaultParams[key];
		
		//store controls Template
		this.storeContrlTemplate();
        
        //Wrap video tag
        this.setElementWrap(document.querySelector(this.videoSelector), 'div', this.wrapC);
		//Append control template
		this.appendControls();
		//Store doom elements
		this.storeNodes();
		//Register events
		this.registerEvents();
		//Set defaults parameters
		this.setDefaults();
    },
	storeContrlTemplate: function(){
		this.controlsTemplate = '<div class="'+ this.vControlsC +'">\
									<div class="'+ this.vPlayPauseC +' '+ this.vPlayC +'" title="Play/Pause"></div>\
									<div class="'+ this.vStreamC +'Container '+ this.vAnimationC +'">\
										<div class="'+ this.vStreamC +'"></div>\
										<div class="'+ this.vStreamC +'Point"></div>\
									</div>\
									<div class="'+ this.vTimeC +'" title="Played time"></div>\
									<div class="'+ this.vVolC +'Container">\
										<div class="'+ this.vVolC +'Btn '+ this.vVolC +'On" title="Volume On/Off"></div>\
										<div class="'+ this.vVolSlidderC +'Container '+ this.vAnimationC +'">\
											<div class="'+ this.vVolSlidderC +'"></div>\
											<div class="'+ this.vVolSlidderC +'Point"></div>\
										</div>\
									</div>\
								</div>\
								<div class="'+ this.vFullScreanC +' '+ this.vFullScreanC +'Off" title="FullScreen On/Off"></div>';
	},
    setElementWrap: function(target, toTag, toClass){
        var wrapper = document.createElement(toTag);
        wrapper.className = toClass +' unselectable';
        
        target.parentNode.insertBefore(wrapper, target);
        wrapper.appendChild(target);
		
		//Store wrapper global
		this.$wrapper = wrapper;
	},
    appendControls: function(){        
        this.$wrapper.innerHTML += this.controlsTemplate;
    },
	storeNodes: function(){
		this.$body = document.getElementsByTagName('body')[0];
		//Store video NODE
		this.$player = this.$wrapper.querySelector(this.videoSelector);
		//Store controls NODE
		this.$streamCont = this.$wrapper.querySelector('.'+ this.vStreamC +'Container');
		this.$stream = this.$wrapper.querySelector('.'+ this.vStreamC);
		this.$streamPoint = this.$wrapper.querySelector('.'+ this.vStreamC +'Point');
		this.$time = this.$wrapper.querySelector('.'+ this.vTimeC);
		this.$playPause = this.$wrapper.querySelector('.'+ this.vPlayPauseC);
		this.$volBtn = this.$wrapper.querySelector('.'+ this.vVolC +'Btn');
		this.$volSliderCont = this.$wrapper.querySelector('.'+ this.vVolSlidderC +'Container');
		this.$volSlider = this.$wrapper.querySelector('.'+ this.vVolSlidderC);
		this.$volSliderPoint = this.$wrapper.querySelector('.'+ this.vVolSlidderC +'Point');
		this.$fullSreen = this.$wrapper.querySelector('.'+ this.vFullScreanC);
	},
	registerEvents: function(){
		//Seeking
		this.$player.addEventListener('seeking', this.vSeeking.bind(this));
		//Play-Pause
		this.$playPause.addEventListener('click', this.playPause.bind(this));
		//Stream's line
		this.$streamCont.addEventListener('click', this.setStreamTime.bind(this));
		//Stream's point
		this.$streamPoint.addEventListener('mousedown', this.dragStartStream.bind(this));
		//Volume button
		this.$volBtn.addEventListener('click', this.volumeBtn.bind(this));
		//Volume slider line
		this.$volSliderCont.addEventListener('click', this.setVolSlider.bind(this));
		//Volume's slider point
		this.$volSliderPoint.addEventListener('mousedown', this.dragStartVol.bind(this));
		//Full screen btn.
		this.$fullSreen.addEventListener('click', this.toggleFullScreen.bind(this));
	},
	setDefaults: function(){
		//Set wrapper width
		this.$wrapper.style.width = this.$player.offsetWidth +'px';
		//Set time
		this.setFormatedTime(this.$player.currentTime);
		//Set default volume
		this.setVolume(this.volume);
		
	},
	preventDefault: function(e){
		e.preventDefault();
		return false;
	},
	vSeeking: function(){
		var streamWidth = this.$streamCont.offsetWidth,
			vDuration = this.$player.duration,
			vCurTime = this.$player.currentTime,
			vPlayed = vCurTime / (vDuration/100);
		
		if(vPlayed == 100 && dClass.hasClass(this.$playPause, this.vPauseC))
			this.pause(this.$playPause);
		
		this.setFormatedTime(this.$player.currentTime);
		this.setStreamProgress(vPlayed);
	},
	getFormatedTime: function(seconds){
		var hours = seconds/3600 >= 1 ? Math.round(seconds/3600) : 0,
			min = ((seconds - hours*3600) / 60) >= 1 ? Math.round((seconds - hours*3600) / 60) : 0,
			sec = Math.round(seconds - (hours*3600 + min*60));
		hours = hours > 0 ? hours+':' : '';
		min = min > 9 ? min : '0'+ min;
		sec = sec > 9 ? sec : '0'+ sec;
		
		return hours + min +':'+ sec;			
	},
	setFormatedTime: function(seconds){
		this.$time.innerHTML = this.getFormatedTime(seconds);
	},
	volumeBtn: function(e){
		var ev = e.currentTarget || e;
		
		dClass.hasClass(ev, this.vVolC +'On') ? this.setVolOff(ev) : this.setVolOn(ev);
	},
	setVolOn: function(ev){
		dClass.removeClass(this.$volBtn, this.vVolC +'Off');
		dClass.addClass(this.$volBtn, this.vVolC +'On');
		
		this.$player.muted = false;
		
		if(this.$player.volume == 0)
			this.setVolume(10);
	},
	setVolOff: function(ev){
		dClass.removeClass(this.$volBtn, this.vVolC +'On');
		dClass.addClass(this.$volBtn, this.vVolC +'Off');
		
		this.$player.muted = true;
	},
	setVolSlider: function(e){
		var volOffset = this.getVolumeOffset(e);
		
		this.setVolume(this.getVolumeFromOffset(volOffset));		
	},
	//Return volume offset in "px" (but without "px" sufix)
	getVolumeOffset: function(e, boundingClientRect){
		var sliderWidth = this.$volSliderCont.offsetWidth,
			contOffsetLeft = boundingClientRect || this.$volSliderCont.getBoundingClientRect().left,
			volOffset = e.pageX - contOffsetLeft;
			
		if(volOffset > sliderWidth)
			volOffset = sliderWidth;
		else if(volOffset < 0)
			volOffset = 0;
			
		return volOffset;
	},
	//Return volume in %
	getVolumeFromOffset: function(offsetX){
		var sliderWidth = this.$volSliderCont.offsetWidth;
		return offsetX/(sliderWidth/100);
	},
	setVolume: function(vol){
		if(vol == 0 && !this.$player.muted)
			this.setVolOff(this.$volBtn);
		else if(vol > 0 && this.$player.muted)
			this.setVolOn(this.$volBtn);
		
		this.setVolPointPos(vol);
		this.$player.volume = (vol/100);
	},
	setVolPointPos: function(vol){
		this.$volSliderPoint.style.left = vol +'%';
		this.$volSlider.style.width = vol +'%';
	},
	dragStartVol: function(e){
		var contOffsetLeft =  this.$volSliderCont.getBoundingClientRect().left;
		
		//Store generated functuions (because of using bind)
		this.volDragHandler = this.moveVolPoint.bind(this, [contOffsetLeft]);
		this.volWindowUpOne = this.dragEndVol.bind(this);
		
		window.addEventListener('mousemove', this.volDragHandler);
		window.addEventListener('mouseup', this.volWindowUpOne);		
		window.addEventListener('dragstart', this.preventDefault);
		window.addEventListener('selectstart', this.preventDefault);
		
		dClass.removeClass(this.$volSliderCont, this.vAnimationC);
	},
	moveVolPoint: function(contOffsetLeft, e){
		var volOffset = this.getVolumeOffset(e, contOffsetLeft);
		
		this.setVolume(this.getVolumeFromOffset(volOffset));
	},
	dragEndVol:function(e){
		window.removeEventListener('mousemove', this.volDragHandler);
		window.removeEventListener('mouseup', this.volWindowUpOne);		
		window.removeEventListener('dragstart', this.preventDefault);
		window.removeEventListener('selectstart', this.preventDefault);
		
		dClass.addClass(this.$volSliderCont, this.vAnimationC);
	},
	playPause: function(e){
		var ev = e.currentTarget || e;
		
		if(dClass.hasClass(ev, this.vPlayC))
			this.play(ev);
		else
			this.pause(ev);
	},
	play: function(ev){
		dClass.removeClass(ev, this.vPlayC);
		dClass.addClass(ev, this.vPauseC);
		
		this.updateInerval = setInterval( this.vSeeking.bind(this), 500 );
		this.$player.play();		
	},
	pause: function(ev){
		dClass.removeClass(ev, this.vPauseC);
		dClass.addClass(ev, this.vPlayC);
		
		this.$player.pause();
		clearInterval(this.updateInerval);
	},
	setStreamProgress: function(persentProgress){
		this.$stream.style.width = persentProgress +'%';
		this.$streamPoint.style.left = persentProgress +'%';
	},
	//Return video progress in %
	getProgressFromOffset: function(offsetX){
		var streamWidth = this.$streamCont.offsetWidth;
		return offsetX / (streamWidth/100);
	},
	//Return video time in seconds from progress in %
	getTimeFromProgress: function(offsetXPersent){
		return (this.$player.duration/100) * offsetXPersent;
	},
	//Return stream offset in "px" (but without "px" sufix)
	getStreamOffset: function(e, boundingClientRect){
		var streamWidth = this.$streamCont.offsetWidth,
			contOffsetLeft = boundingClientRect || this.$streamCont.getBoundingClientRect().left,
			streamOffset = e.pageX - contOffsetLeft;
			
		if(streamOffset > streamWidth)
			streamOffset = streamWidth;
		else if(streamOffset < 0)
			streamOffset = 0;
			
		return streamOffset;
	},
	setStreamTime: function(e){
		var streamOffset = this.getStreamOffset(e);
		
		this.$player.currentTime = this.getTimeFromProgress(this.getProgressFromOffset(streamOffset));
	},
	dragStartStream: function(e){		
		//Store generated functuions (because of using bind)
		this.streamDragHandler = this.moveStreamPoint.bind(this);
		this.streamWindowUpOne = this.dragEndStream.bind(this);
		
		window.addEventListener('mousemove', this.streamDragHandler);
		window.addEventListener('mouseup', this.streamWindowUpOne);
		window.addEventListener('dragstart', this.preventDefault);
		window.addEventListener('selectstart', this.preventDefault);
		
		dClass.removeClass(this.$streamCont, this.vAnimationC);
		
		if(!this.$player.paused)
			clearInterval(this.updateInerval);
	},
	moveStreamPoint: function(e){
		var streamOffset = this.getStreamOffset(e);
		
		this.setStreamProgress(this.getProgressFromOffset(streamOffset));	
	},
	dragEndStream: function(e){
		window.removeEventListener('mousemove', this.streamDragHandler);
		window.removeEventListener('mouseup', this.streamWindowUpOne);		
		window.removeEventListener('dragstart', this.preventDefault);
		window.removeEventListener('selectstart', this.preventDefault);
		
		var offsetXPersent = this.getProgressFromOffset(this.getStreamOffset(e));
		
		if(!this.$player.paused)
			this.updateInerval = setInterval( this.vSeeking.bind(this), 500 );
		else
			this.$player.currentTime = this.getTimeFromProgress(offsetXPersent);
		
		dClass.addClass(this.$streamCont, this.vAnimationC);
	},
	toggleFullScreen: function(e){
		var btn = e.currentTarget || e;
		dClass.hasClass(btn, this.vFullScreanC +'Off') ? this.fullSreenOn(btn) : this.fullSreenOff(btn);
	},
	fullSreenOn: function(btn){
		dClass.removeClass(btn, this.vFullScreanC +'Off');
		dClass.addClass(btn, this.vFullScreanC +'On');
		dClass.addClass(this.$wrapper, 'fullSreen');

		if (document.documentElement.requestFullscreen) {
		  document.documentElement.requestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
		  document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
		  document.documentElement.webkitRequestFullscreen();
		}
	},
	fullSreenOff: function(btn){
		dClass.removeClass(btn, this.vFullScreanC +'On');
		dClass.addClass(btn, this.vFullScreanC +'Off');
		dClass.removeClass(this.$wrapper, 'fullSreen');
		
		if (document.cancelFullScreen) {
		  document.cancelFullScreen();
		} else if (document.mozCancelFullScreen) {
		  document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
		  document.webkitCancelFullScreen();
		}
	}
});

var video = new VideoControls({
    volume: 15
});
function Tabber(parameters){	
	this.headerId= parameters.headerId || 'tab-headers';
	this.contentId= parameters.contentId || 'tab-content';
	this.activeTabClass= parameters.activeTabClass || 'active';
	
	this.headerTabs= document.querySelectorAll('#' +this.headerId+ ' li');
	this.contentTabs= document.querySelectorAll('#' +this.contentId+ ' li');

	this.activeTab=  this.contentTabs[parameters.activeTab-1] ?  parameters.activeTab-1 : 0;
}

Tabber.prototype = {
	init: function(){
		this.registerEvents();
		this.defaultTab();
	},

	registerEvents: function(){
		for(var i=0; i < this.headerTabs.length; i++){
			this.headerTabs[i]._contentElement = this.contentTabs[i];
			this.headerTabs[i].addEventListener('click', this);
		}
	},

	handleEvent: function(e){
		switch(e.type){
			case 'click':
				this.showTab(e);	
				break;
		}
	},

	defaultTab: function(){
		this.showTab(this.headerTabs[this.activeTab]);
	},

	showTab: function(e){
		var target = e.currentTarget || e;
		
		for(var i=0; i < this.headerTabs.length; i++){
			this.headerTabs[i].className = '';
			this.contentTabs[i].className = '';
		}

		target.className = this.activeTabClass;
		target._contentElement.className = this.activeTabClass;
	}
};

var tabs = new Tabber({
	activeTab: 3
});

tabs.init();
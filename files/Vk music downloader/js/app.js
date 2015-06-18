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
//Bind method fix for IE7-8
Function.prototype.bind = (function(){  
  var _slice = Array.prototype.slice;
  
  return function(context) {
    var fn = this,
        args = _slice.call(arguments, 1);

    if (args.length) { 
      return function() {
        return arguments.length
          ? fn.apply(context, args.concat(_slice.call(arguments)))
          : fn.apply(context, args);
      }
    } 
    return function() {
      return arguments.length
        ? fn.apply(context, arguments)
        : fn.call(context);
    }; 
  }
})();

//Modal
var Modal = {
	init: function(param){
		this.bgSelector = param.bgSelector;
		this.modalSelector = param.modalSelector;
		this.closeSelector = param.closeSelector;
		this.activeClass = param.activeClass;

		this.bg = document.querySelector(this.bgSelector);
		this.modal = document.querySelector(this.modalSelector);
		this.closeBtn =  document.querySelector(this.closeSelector);
		this.registerEvents();
	},
	registerEvents: function(){
		var obj = this;
		this.closeBtn.onclick = this.hide.bind(obj);
		this.bg.onclick = this.hide.bind(obj);
	},
	show: function(){
		dClass.addClass(this.bg, this.activeClass);
		dClass.addClass(this.modal, this.activeClass);
	},
	hide: function(e){
		dClass.removeClass(this.bg, this.activeClass);
		dClass.removeClass(this.modal, this.activeClass);
		return false;
	}
}
Modal.init({
	bgSelector: '.bg',
	modalSelector: '.modal',
	closeSelector: '.close',
	activeClass: 'active'
});
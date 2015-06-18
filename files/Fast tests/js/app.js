if(typeof Object.prototype.extend !== 'function'){
	Object.prototype.extend = function(o){
		if(this.toString().slice(8, -1) != 'Object')
			return;

		for(key in o) if(o.hasOwnProperty(key)){
			this[key] = o[key];
		}
	}
}

if(typeof Object.create !== 'function'){
	Object.create = function(o){
		function F(){};
		F.prototype = o;
		return new F();
	}
}

function Person(name){
    this.name = name || 'Default';
}
Person.prototype.sayHello = function(){
    console.log(this.name +' says Hello!');
    return this;
}

function Worker(name, exp){
    Person.apply(this, arguments);
    this.exp = exp;
}
Worker.prototype = Object.create(Person.prototype);
Worker.prototype.extend({
	getExperience: function(){
		console.log(this.name +' has experience about '+ this.exp);
		return this;
	},
	sayHello: function(){
		console.log('My name is '+ this.name +'. And this is my custom "Say Hello"!');
		return this;
	}
});

function Developer(name, exp, skills){
    Worker.apply(this, arguments);
    this.skills = skills || ['Drinking beer'];
}
Developer.prototype = Object.create(Worker.prototype);
Developer.prototype.extend({
	code: function(){
		console.log(this.name +' using his skills "'+ this.skills + '" is codding now!');
		return this;
	},
	fixBug: function(){
		console.log(this.name +' is fixing bug now....');
	},
	sayHello: function(){
		console.log(this.name +' is drinking beer :)...');
		return this;
	}
});

var person = new Person('Jobs');
person.sayHello();

var worker = new Worker('Stive', '6 years');
worker.sayHello().getExperience();

var developer = new Developer('Alex', '4 years', ['html', 'css', 'js']);

developer.sayHello().code();
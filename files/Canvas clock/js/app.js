function Clock(param){
	var defaults = {
			elem: document.getElementsByTagName('canvas')[0],
			width: 300,
			height: 300
		},
		param = param || defaults;

	this.elem = param.elem || defaults.elem;
	this.width = param.width || defaults.width;
	this.height = param.height || defaults.height;
	this.elem.height = this.height;
	this.elem.width = this.width;
	this.context = this.elem.getContext('2d');
}
Clock.prototype.init = function() {
	var centerX = this.width / 2,
		centerY = this.height / 2,
		radius = (this.width > this.height ? this.height/2 : this.width/2) -20,
		context = this.context,
		date = new Date(),
		s = date.getSeconds(),
		m = date.getMinutes(),
		h = date.getHours() >=12 ? date.getHours()-12 : date.getHours(),
		weekDay = date.getDay()-1,
		week = ['Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.', 'Sun.'];

	//Clear clock
	context.clearRect(0, 0, this.width, this.height);

	context.strokeStyle = '#159993';
	//Main circle
	context.beginPath();
	context.arc(centerX, centerY, radius, 0, 2*Math.PI, false);
	context.lineWidth = 5;
	context.stroke();

	//Center circle
	context.beginPath();
	context.arc(centerX, centerY, 5, 0, 2*Math.PI, false);
	context.lineWidth = 4;
	context.fillStyle = 'red';
	context.stroke();

	// Hour marks
	context.save();
	context.translate(this.width/2, this.height/2);
	context.lineWidth = 8;
	context.lineCap = "round";

	for (var i=0;i<12;i++){
		context.beginPath();
		context.rotate(Math.PI/6);
		context.moveTo(radius-20,0);
		context.lineTo(radius-10,0);
		context.stroke();
	}

	// Minute marks
	context.lineWidth = 5;
	for (i=0;i<60;i++){
		if (i%5!=0) {
			context.beginPath();
			context.moveTo(radius-15,0);
			context.lineTo(radius-10,0);
			context.stroke();
		}
		context.rotate(Math.PI/30);
	}
	context.restore();

	//Day
	context.save();
	var rectWidth = 40,
		rectHeight = 24,
		rectX = centerX*1.25,
		rectY = centerY-rectHeight/2;

	context.beginPath();
	context.rect(rectX, rectY, rectWidth, rectHeight);
	context.lineWidth = 2;
	context.strokeStyle = '#484540';
	context.stroke();

	context.textAlign = 'center';
	context.fillStyle = '#159993';
	context.font = 'italic bold 12pt Calibri';
	context.fillText(week[weekDay], rectX+20, centerY+5);
	context.restore();

	context.strokeStyle = '#606259';
	context.lineWidth = 6;
	//Hours
	context.save();
	context.translate(this.width/2, this.height/2);
	context.beginPath();
	context.rotate( (h/12+m/12/60) * 2 * Math.PI);
	context.moveTo(0,0);
	context.lineTo(0,-radius*0.5);
	context.stroke();
	context.restore();

	//Minutes
	context.save();
	context.translate(this.width/2, this.height/2);
	context.rotate(m*2*Math.PI/60);
	context.beginPath();
	context.moveTo(0,0);
	context.lineTo(0,-radius*0.6);
	context.stroke();
	context.restore();

	//Seconds
	context.save();
	context.translate(this.width/2, this.height/2);
    context.beginPath();
    context.rotate(s*2*Math.PI/60);
    context.strokeStyle = '#EA3737';
    context.lineWidth = 4
    context.moveTo(0,radius*0.1);
    context.lineTo(0,-radius*0.7);
    context.stroke();
    context.restore();
};
Clock.prototype.degreesToRadians = function(degrees) {
	return Math.PI / 180 * degrees;
};

var clock = new Clock({
	width: 300,
	height: 300
});
clock.init();
setInterval(function(){
	clock.init.call(clock);
}, 1000);
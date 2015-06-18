var sum = function(a){
	return function(b){
		return a + b;
	};
};
sum(1)(2);


function inBetween(){

}

function filter(arr, func){
	var newArray = [];
	for(var i=0; i<arr.length; i++){
		var value = arr[i];
		func(value){

		}
	}
}





// Date
function getTime(){
	var months = ['January', 'February','March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		d = new Date();
		
	return months[d.getMonth()]+ ' ' +d.getDate()+ ', ' +d.getFullYear();	
}
function getRandNumb(min, max){
    return Math.floor( Math.random() * (max - min + 1) +min );
}
var ARR = {
    sort: function(arr, type){
        var type = type ? type : '+';
        
        return type == '-'? this.sortDec(arr) : this.sortInc(arr);        
    },
    sortInc: function(arr){
        var sortArr = arr,
            sorted = false;
        
        while (sorted == false){
            sorted = true;    
            
            for(var i=0; i < arr.length; i++){
                var curEl = arr[i],
                    nextEl = arr[i+1];
                    
                if(curEl > nextEl){
                    sorted = false;
                    
                    sortArr[i] = nextEl;
                    sortArr[i+1] = curEl;
                }        
            }
        }
        return sortArr;
    },
    sortDec: function(arr){
        var sortArr = arr,
            sorted = false;
            
        while (sorted == false){
            sorted = true;
            
            for(var i=0; i < arr.length; i++){
                var curEl = arr[i],
                    nextEl = arr[i+1];
                    
                if(curEl < nextEl){
                    sorted = false;                    
                    sortArr[i] = nextEl;
                    sortArr[i+1] = curEl;
                }        
            }    
        }
        return sortArr;
    },
    getMax: function(arr){
        var max = {
            val: arr[0],
            i: 0
        };    
        for(var i=1; i<arr.length; i++){
            if(arr[i] > max.val){
                max = {
                    val: arr[i],
                    i: i
                };    
            }        
        }
        return max; 
    },
    getMin: function(arr, ranges){
        var range = {
                from: ranges && ranges.from ? ranges.from : 0,
                to: ranges && ranges.to ? ranges.to : arr.length-1
            },        
            min = {
                val: arr[0],
                i: 0
            };
            
        for(var i=range.from; i<=range.to; i++){
            if(arr[i] < min.val){
                min = {
                    val: arr[i],
                    i: i
                };    
            } 
        }
        return min;    
    }
}

//Get rund array
var arr = [],
    arrLength = 10;
for(var i=0; i < arrLength; i++){
    arr.push( getRandNumb(5, 15) );    
}

document.write(arr +'<br>');
document.write('Min: '+ ARR.getMin(arr).val +'<br>');
document.write('Max: '+ ARR.getMax(arr).val +'<br>');
document.write('Sorted array: '+ ARR.sort(arr, '+') +'<br>');
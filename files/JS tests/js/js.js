var Figure = function(){};                              // создаём конструктор  
  
var fig1 = new Figure();                                // создаём экземпляр Figure  
alert(fig1.constructor);                                // (function)   свойство присутствует  
alert(fig1.constructor === Figure);                     // (true)   и указывает на конструктор  
alert(fig1.hasOwnProperty('constructor'));              // (false)  оно не находится в объекте,  
alert(fig1.constructor === fig1.__proto__.constructor); // (true)   а найдено через __proto__  
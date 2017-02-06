// ==UserScript==
// @name         Drive2 likes
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Like every post!
// @include      /https?\:\/\/www\.drive2\.ru.*/
// ==/UserScript==

(function() {
    'use strict';

    var likes = document.querySelectorAll('.js-like-button:not(.is-pressed)'),
        deley = 500;

    likes.forEach(function(el, i){
        (function(element, j){
            setTimeout(function(){
                element.click();
            }, j * deley);
        })(el, i);
    });
})();
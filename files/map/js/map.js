(function( $, undefined ) {
    "use strict"
    $(document).ready(function(){
        var Window = $(window),
            svgObj = $('.map-area'),
            clickObj = $('.map-area-wrapper'),
            parentPosition,
            mapElement = 0,
            imageUrl,
            imgWidth,
            imgHeight,
            rectangle,
            firstPolyBox = false,
            polylinePoints = '',
            svgElementsClass = 'areaElement',
            svgDragElementClass = 'areaDrag',
            drawType = 'rect';
        $('#domain').val($.Storage.get('domain'));
        drawType = $.Storage.get('drawType') ? $.Storage.get('drawType') : drawType;
        $('[data-draw-type='+drawType+']').addClass('activeType');
        var popup = '<div style="box-shadow: 0px 0px 5px 1px white; z-index:100;display: none;position:absolute; font:11px arial; background: #FDF2B5; border-radius: 10px; padding: 10px"\
                    class="areaPopup popup">\
                    <h4 style="margin-top: 0;">Attributes</h4>\
                    <span id="close" style="position: absolute;right: 0px;top: 0px;width: 25px;height: 25px;background: red;border-radius: 0 10px;color: white;font-size: 19px;text-align: center; cursor:pointer;" title="close">X</span>\
                    <p style="margin: 0 0 15px; float: left; width: 150px;">\
                    <label style="display: block" for="title-attr">Title</label>\
                    <input style="margin: 0" type="text" id="title-attr" placeholder="Enter title">\
                    </p>\
                    <p style="margin: 0 3px 15px 5px; float: left; width: 150px">\
                    <label style="display: block" for="alt-attr">Alt</label>\
                    <input style="margin: 0" type="text" id="alt-attr" placeholder="Enter alt">\
                    </p>\
                    <p style="margin: 0 0 15px; clear: left;">\
                    <label style="display: block" for="href-attr">Href</label>\
                    <input style="margin: 0; width: 100%" type="text" id="href-attr" placeholder="Enter href">\
                    </p>\
                    <p>\
                    <input style="float:left; margin: 0;background: #6EFF7F;border: 1px solid #0CF;padding: 6px 20px;color: #8D9AFA;cursor: pointer;border-radius: 5px;" type="submit" class="save" value="Save"/>\
                    <input style="float:right; margin: 0;background: red; border: 1px solid red; padding: 6px 20px; color: #fff; cursor: pointer; border-radius: 5px;" type="button" class="remove" value="Remove element"/>\
                    </p>\
                    </div>';
        var codePopup = '<div class="codePopup popup" style="box-shadow: 0px 0px 5px 1px white; z-index: 90; font: 12px arial; background:#FDF2B5; display: none; width: 600px; position: absolute; left: 50%; top: 100px; margin: 0 0 0 -320px; padding: 20px; border-radius: 10px;">\
                        <span style="position: absolute;right: 0px;top: 0px;width: 25px;height: 25px;background: red;border-radius: 0 10px;color: white;font-size: 19px;text-align: center; cursor:pointer;" title="close" id="close">X</span>\
                        <span style="color: green;"><b>Double click</b> on text to Select all.</span>\
                        <div tabindex="1" class="code" id="selectRange"></div>\
                        </div>';
        var confirmMessage = '<div id="confirmDelete" class="popup" style="box-shadow: 0px 0px 5px 1px white; z-index:100;display: none;position:absolute; font:11px arial; background: #FDF2B5; border-radius: 10px; padding: 10px; width: 200px;">\
                            <span style="position: absolute;right: 0px;top: 0px;width: 25px;height: 25px;background: red;border-radius: 0 10px;color: white;font-size: 19px;text-align: center; cursor:pointer;" title="close" id="close">X</span>\
                            <div style="margin: 20px 0; font-size: 12px; color: red;">Remove All <b>"area elements"</b> from image?</div>\
                            <input type="button" value="Yes" id="confirmYes" style="float:left; margin: 0;background: #6EFF7F;border: 1px solid #0CF;padding: 6px 20px;color: #8D9AFA;cursor: pointer;border-radius: 5px;">\
                            <input type="button" value="No" id="confirmNo" style="float:right; margin: 0;background: red; border: 1px solid red; padding: 6px 20px; color: #fff; cursor: pointer; border-radius: 5px;">\
                            </div>';
        function startElementPosition(parentPosition, absolutePosition){
            return {
                y : absolutePosition.y - Math.round(parentPosition.top),
                x : absolutePosition.x - Math.round(parentPosition.left)
            }
        }
        function choseTypeElement(){
            $('#drawTypes li[data-draw-type]').live('click', function(){
                $('#helperBox').trigger('mousedown');
                var $this = $(this);
                drawType = $this.data('draw-type');
                $.Storage.set('drawType', drawType);
                $('#drawTypes li').removeClass('activeType');
                $this.addClass('activeType');
                Window.unbind('mousemove dragstart selectstart');
            })
        }
        function makeSVG(tag, attrs) {
            var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var k in attrs)
                el.setAttribute(k, attrs[k]);
            return el;
        }
        function getRadius(width, height){
            return Math.round(Math.sqrt(width*width+height*height));
        }
        function getXpositionAndWidth(startPosition, endPosition, newPolyPoint){
            if(drawType == 'poly'){
                if(newPolyPoint){
                    polylinePoints = polylinePoints+' '+startPosition.x+' '+startPosition.y;
                }
                return {
                    points : polylinePoints+' '+endPosition.x+' '+endPosition.y
                }
            }
            else if(startPosition.y <= endPosition.y && startPosition.x <= endPosition.x){//bottom right
                var width = endPosition.x-startPosition.x,
                    height = endPosition.y-startPosition.y;
                if(drawType == 'rect'){
                    return {
                        'x' : startPosition.x,
                        'y' : startPosition.y,
                        'width' : width,
                        'height' : height
                    }
                }
                else if(drawType =='circle'){
                    return {
                        'r': getRadius(width, height)
                    }
                }
            }
            else if(startPosition.y >= endPosition.y && startPosition.x <= endPosition.x){//top right
                var width = endPosition.x-startPosition.x,
                    height = startPosition.y-endPosition.y;
                if(drawType == 'rect'){
                    return {
                        'x' : startPosition.x,
                        'y' : endPosition.y,
                        'width' : endPosition.x-startPosition.x,
                        'height' : startPosition.y-endPosition.y
                    }
                }
                else if(drawType =='circle'){
                    return {
                        'r': getRadius(width, height)
                    }
                }
            }
            else if(startPosition.y >= endPosition.y && startPosition.x >= endPosition.x){//top left
                var width = startPosition.x-endPosition.x,
                    height = startPosition.y-endPosition.y;
                if(drawType == 'rect'){
                    return {
                        'x' : endPosition.x,
                        'y' : endPosition.y,
                        'width' : startPosition.x-endPosition.x,
                        'height' : startPosition.y-endPosition.y
                    }
                }
                else if(drawType =='circle'){
                    return {
                        'r': getRadius(width, height)
                    }
                }
            }
            else{//bottom left
                var width = startPosition.x-endPosition.x,
                    height = endPosition.y-startPosition.y;
                if(drawType == 'rect'){
                    return {
                        'x' : endPosition.x,
                        'y' : startPosition.y,
                        'width' : startPosition.x-endPosition.x,
                        'height' : endPosition.y-startPosition.y
                    }
                }
                else if(drawType =='circle'){
                    return {
                        'r': getRadius(width, height)
                    }
                }
            }
        }
        function startDraw(startPosition){
            if(drawType == 'rect'){
                return makeSVG('rect', {
                    'x' : startPosition.x,
                    'y' : startPosition.y,
                    'id' : 'element'+mapElement,
                    'class' : svgElementsClass,
                    'width' : 0,
                    'height' : 0
                });
            }
            if(drawType == 'circle'){
                return makeSVG('circle',{
                    'cx' : startPosition.x,
                    'cy' : startPosition.y,
                    'r' : 0,
                    'id' : 'element'+mapElement,
                    'class' : svgElementsClass
                })
            }
            if(drawType == 'poly'){
                svgObj.append(makeSVG('circle', {
                    'cx' : startPosition.x,
                    'cy' : startPosition.y,
                    'r' : 3,
                    'id' : 'helperBox',
                    'class' : 'helperBox'
                }));
                firstPolyBox = true;
                polylinePoints = startPosition.x+' '+startPosition.y;
                return makeSVG('polyline',{
                    'points' : polylinePoints+' '+polylinePoints,
                    'id' : 'element'+mapElement,
                    'class' : 'tempPoly'
                })
            }
        }
        function contDraw(mapElement, getXpositionAndWidth, startPosition, endPosition, newPolyPoint){
            $('#element'+mapElement).attr(getXpositionAndWidth(startPosition, endPosition, newPolyPoint));
        }
        function endDraw(drawType, mapElement){
            var $drowlerElement = $('#'+mapElement),
                coordinates;
            if(drawType == 'rect'){
                var x1 = $drowlerElement.attr('x'),
                    y1 = $drowlerElement.attr('y'),
                    x2 = +$drowlerElement.attr('x') + (+$drowlerElement.attr('width')),
                    y2 = +$drowlerElement.attr('y') + (+$drowlerElement.attr('height')),
                    coordinates = x1+','+y1+','+x2+','+y2;
            }
            else if(drawType == 'circle'){
                var x = $drowlerElement.attr('cx'),
                    y = $drowlerElement.attr('cy'),
                    r = $drowlerElement.attr('r'),
                    coordinates = x+','+y+','+r;
            }
            else if(drawType == 'poly' || drawType == 'polygon'){
                coordinates = ($drowlerElement.attr('points')).split(' ').join(', ');
                coordinates = coordinates.substring(0, coordinates.length);
            }
            $drowlerElement.attr({'data-shape': drawType, 'data-coords': coordinates});
        }
        function drawler() {
            $(document).delegate('.map-area-wrapper', 'mousedown', function(e) {
                var startAbsolutePosition = {
                    y : Math.round(e.pageY),
                    x : Math.round(e.pageX)
                }
                var targetID = e.target.id;
                var targetClass = (targetID ? $('#'+targetID).attr('class') : ' ');
                var startPosition = startElementPosition(parentPosition, startAbsolutePosition);

                if( ($('.prevMap.hide')).length == 0 && targetClass.search(svgElementsClass) == -1  && e.target.id !== 'helperBox' && startPosition.x < imgWidth && startPosition.x > -1 && startPosition.y < imgHeight && startPosition.y > -2){
                    if(!firstPolyBox && drawType == 'poly'){
                        svgObj.prepend(startDraw(startPosition));
                        $(document).undelegate('rect, circle', 'mousedown');
                    }
                    else if(drawType == 'poly'){
                        contDraw(mapElement, getXpositionAndWidth, startPosition, startPosition, true);
                    }
                    else{
                        svgObj.append(startDraw(startPosition));
                    }

                    Window.on("dragstart selectstart", function(e){e.preventDefault()});

                    Window.on('mousemove', function(e) {
                        var endPosition = startElementPosition(parentPosition, {x: e.pageX, y: e.pageY});
                        contDraw(mapElement, getXpositionAndWidth, startPosition, endPosition);
                    })
                    if(drawType !== 'poly'){
                        Window.one('mouseup', function() {
                            Window.unbind('mousemove dragstart selectstart');
                            endDraw(drawType, 'element'+mapElement);
                            mapElement +=1;
                        })
                    }
                }
                else if(e.target.id == 'helperBox'){
                    Window.unbind('mousemove dragstart selectstart');
                    $('#helperBox, #element'+mapElement).remove();
                    svgObj.append(makeSVG('polygon',{
                        'points' : polylinePoints,
                        'id' : 'element'+mapElement,
                        'class' : svgElementsClass
                    }));
                    endDraw(drawType, 'element'+mapElement);
                    polylinePoints = '';
                    firstPolyBox = false;
                    mapElement +=1;
                    moveElements();
                }
            })
        };
        function moveElement(target, $this, tempEndPosition, difrentPos, startPosition){
            var newElementAttrPos = {};
            if(target.tagName == 'circle' || target.tagName == 'rect'){
                newElementAttrPos[difrentPos.typeX] = tempEndPosition.x - difrentPos.x,
                newElementAttrPos[difrentPos.typeY] = tempEndPosition.y - difrentPos.y;
            }
            else if(target.tagName == 'polygon'){
                var points = (difrentPos.points).split(' ').join(','); //Format for IE9
                    points = points.split(',');
                var diffrent = {
                    'x' : tempEndPosition.x - startPosition.x,
                    'y' : tempEndPosition.y - startPosition.y
                };
                newElementAttrPos[difrentPos.typeAttr] = new String();
                for(var i in points){
                    if(i % 2 == 0){
                        newElementAttrPos[difrentPos.typeAttr] = newElementAttrPos[difrentPos.typeAttr] +' '+(parseInt(points[i]) + diffrent.x);
                    }
                    else{
                        newElementAttrPos[difrentPos.typeAttr] = newElementAttrPos[difrentPos.typeAttr] +' '+(parseInt(points[i]) + diffrent.y);
                    }
                }
                newElementAttrPos[difrentPos.typeAttr] = (newElementAttrPos[difrentPos.typeAttr]).substring(1);
            }
            $this.attr(newElementAttrPos);
        }
        function moveElements() {
            $(document).delegate('rect, circle, polygon', 'mousedown', function(e) {
                if(polylinePoints == ''){
                    var $this = $(this),
                        target = e.target,
                        difrentPos = {},
                        startAbsolutePosition = {
                            y : Math.round(e.pageY),
                            x : Math.round(e.pageX)
                        },
                        startPosition = startElementPosition(parentPosition, startAbsolutePosition);
                    $this.attr('class', svgElementsClass+' '+svgDragElementClass);
                    if(target.tagName == 'circle' || target.tagName == 'rect'){
                        if(target.tagName == 'circle'){
                            var startFrom = {
                                'x' : +($this.attr('cx')),
                                'y' : +($this.attr('cy')),
                                typeX : 'cx',
                                typeY : 'cy'
                            };
                        }
                        else if(target.tagName == 'rect'){
                            var startFrom = {
                                'x' : +($this.attr('x')),
                                'y' : +($this.attr('y')),
                                typeX : 'x',
                                typeY : 'y'
                            };
                        }
                        difrentPos = {
                            'x' : startPosition.x - startFrom.x,
                            'y' : startPosition.y - startFrom.y,
                            typeX : startFrom.typeX,
                            typeY : startFrom.typeY
                        };
                    }
                    else if(target.tagName == 'polygon'){
                        difrentPos = {
                            'points' : $this.attr('points'),
                            typeAttr : 'points'
                        };
                    }

                    Window.on("dragstart selectstart", function(e){e.preventDefault()});

                    Window.on('mousemove', function(e) {
                        var tempEndPosition = startElementPosition(parentPosition, {x: e.pageX, y: e.pageY});
                        if(tempEndPosition.x < imgWidth && tempEndPosition.x > -1 && tempEndPosition.y < imgHeight && tempEndPosition.y > -2){
                            moveElement(target, $this, tempEndPosition, difrentPos, startPosition);
                        }
                    })
                    Window.one('mouseup', function() {
                        Window.unbind('mousemove dragstart selectstart');
                        endDraw($(target).data('shape'), target.id);
                        $this.attr('class', svgElementsClass);
                    });
                }
            });
        };
        function appendText(node,txt){
            node.append(document.createTextNode(txt));
        }
        function appendElement(node,tag,text){
            var ne = document.createElement(tag);
            if(text) $(ne).text(text);
            node.append(ne);
        }
        function checkForUndefined(value){
            return value ? value : ' ';
        }
        function openPopup(e, popup, $this){
            $('#modalBG').fadeIn();
            $('.popup').remove();
            $('body').append(popup);
            var $popup = $('.popup');
            if(e.target.className.animVal == svgElementsClass){
                var title = $this.attr('data-title'),
                    alt = $this.attr('data-alt'),
                    href = $this.attr('data-href');
                $popup.find('#title-attr').val(title);
                $popup.find('#alt-attr').val(alt);
                $popup.find('#href-attr').val(href);
                $popup.attr('data-element', $this.attr('id'));
            }
            $popup.css({'top':e.pageY, 'left':e.pageX}).fadeIn();
            $popup.find('input').first().focus();
        }
        function closePopup(e, $this){
            if(e.target.id !== 'close'){
                $('#close').trigger('click');
            }
            else{
                $this.closest('div').remove();
                $('#modalBG').fadeOut('fast');
            }
        }
        function removeElement(){
            $('#'+($('.areaPopup').attr('data-element'))).remove();
            $('.areaPopup #close').trigger('click');
        }
        function setAreaAttributs(){
            var $popup = $('.areaPopup'),
                element = $popup.attr('data-element'),
                title = $popup.find('#title-attr').val(),
                alt = $popup.find('#alt-attr').val(),
                href = $popup.find('#href-attr').val();
            $('#'+element).attr({'data-title': title, 'data-alt': alt, 'data-href': href});
            $('.areaPopup #close').trigger('click');
        }
        function generateMap(){
            var usemapTitle = $('#mapName').val();
            var possible = "0123456789";

            if(!usemapTitle){
                usemapTitle = 'map';
                for( var i=0; i < 4; i++ ){
                    usemapTitle += possible.charAt(Math.floor(Math.random() * possible.length));
                }
            }
            $('#modalBG').fadeIn();
            $('body').append(codePopup);
            var $code = $('.codePopup .code');
            appendText($code, '<img src="'+imageUrl+'" usemap="#'+usemapTitle+'"/>');
            appendElement($code, 'br');
            appendText($code,'<map name="'+usemapTitle+'" id="'+usemapTitle+'">');
            appendElement($code, 'br');

            $('.map-area .'+svgElementsClass).each(function(){
                var $this = $(this),
                    shape = checkForUndefined($this.attr('data-shape')),
                    coords = checkForUndefined($this.attr('data-coords')),
                    href = checkForUndefined($this.attr('data-href')),
                    title = checkForUndefined($this.attr('data-title')),
                    alt = checkForUndefined($this.attr('data-alt'));
                appendElement($code, 'div', '<area shape="'+shape+'" coords="'+coords+'" href="'+href+'" title="'+title+'" alt="'+alt+'"/>');
            });
            appendText($code, '</map>');
            $('.codePopup').fadeIn();
            $('#selectRange').trigger('dblclick');
        }
        function showPreviewMap(){
            var usemapTitle = 'previewMap';
            $('.prevMap').removeClass('show').addClass('hide');

            $('.map-area-wrapper').append('<map name="'+usemapTitle+'" id="'+usemapTitle+'">');
            $('.map-area .'+svgElementsClass).each(function(){
                var $this = $(this),
                    shape = checkForUndefined($this.attr('data-shape')),
                    coords = checkForUndefined($this.attr('data-coords')),
                    href = checkForUndefined($this.attr('data-href')),
                    title = checkForUndefined($this.attr('data-title')),
                    alt = checkForUndefined($this.attr('data-alt'));
                $('.map-area-wrapper #previewMap').append('<area shape="'+shape+'" coords="'+coords+'" href="'+href+'" title="'+title+'" alt="'+alt+'"/>');
            });
            $('.map-area').fadeOut();
        }
        function hidePreviewMap(){
            $('#previewMap').remove();
            $('.prevMap').removeClass('hide').addClass('show');
            $('.map-area').fadeIn();
        }
        function showHideDomain(){
            $('#showDomain').live('click', function(){
                $('#domain').animate({width:'toggle'},150).focus();
                $(this).toggleClass('rightBorder');
            })
        }
        function loadImage(){
            var fullImageUrl = ($('#domain').val())+''+($('#imgUrl').val());
            imageUrl = $('#imgUrl').val();
            if(!fullImageUrl){
                $('#imgUrl, #domain').css('border-color', 'red');
                return false;
            }
            $('#imgUrl, #domain').css('border-color', 'transparent');
            var $img = $('.map-area-wrapper img');
            $("body, html").css("cursor", "progress");
            $img.load(function(){
                $('.choseImage').css('display', 'none');
                $('.imageMapping').css('display', 'block');
                imgWidth = $img.width();
                imgHeight = $img.height();
                $('.map-area').attr({'width': imgWidth, 'height': imgHeight});
                $('.map-area-wrapper').width(imgWidth).height(imgHeight);
                parentPosition = svgObj.offset();
                $.Storage.set('domain', $('#domain').val());
                $('body, html').css('cursor', 'default');
            }).error(function(){
                $('#imgUrl, #domain').css('border-color', 'red');
                $('body, html').css('cursor', 'default');
                return false;
            }).attr({'src':fullImageUrl, 'usemap': '#previewMap'});
        }
        function select_result(id){

            var selection = window.getSelection();
            var range = document.createRange();
            var tab = document.getElementById(id);

            range.selectNodeContents(tab);
            selection.addRange(range);

        }
        function clearInputs(){
            $('#clearUrl').live('click', function(){
                $('#imgUrl, #domain').val('');
                $.Storage.remove('domain');
            })
        }
        function clearSVG(){
            $('.'+svgElementsClass).remove();
        }
        $('#clearSVG').live('click', function(e){
            openPopup(e, confirmMessage, $(this));
        })
        $('#selectRange').live('dblclick', function(e){
            select_result('selectRange');
        })
        $('rect, circle, polygon').live('dblclick', function(e){
            openPopup(e, popup, $(this));
        })
        $('#close, #modalBG, #confirmDelete #confirmNo, #confirmDelete #confirmYes').live('click', function(e){
            closePopup(e, $(this));
        })
        $(document).live('keyup', function(e){
            if(e.keyCode == '27') $('#modalBG').trigger('click');
        })
        $('.areaPopup .remove').live('click', function(){
            removeElement();
        })
        $('.areaPopup .save').live('click', function(){
            setAreaAttributs();
        })
        $('.areaPopup input[type="text"]').live('keyup', function(e){
            if(e.keyCode == '13') $('.areaPopup .save').trigger('click');
        })
        $('#confirmDelete #confirmYes').live('click', function(e){
            clearSVG();
        })
        $('#loadImage').live('click', function(){
            loadImage();
        })
        $('#imgUrl, #domain').on('keyup', function(e){
            if(e.keyCode == '13') $('#loadImage').trigger('click');
        })
        $('#generateMap').live('click', function(){
            generateMap();
        })
        $('#mapName').on('keyup', function(e){
            if(e.keyCode == '13') $('#generateMap').trigger('click');
        });
        $('.prevMap.show').live('click', function(){
            showPreviewMap();
        })
        $('.prevMap.hide').live('click', function(){
            hidePreviewMap();
        })
        choseTypeElement();
        drawler();
        moveElements();
        showHideDomain();
        clearInputs();
    })
})($);
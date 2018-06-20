javascript: (function() {
	var swfScriptUrl = "//avasin.cf/Vk%20music%20downloader/OpenSave/opensave.js",
		audioCounter = 0,
		audioBtnOptions = {
			width: 20,
			height: 20,
			image_up: "//avasin.cf/Vk%20music%20downloader/img/dImg_20x20.png",
			swf: "//avasin.cf/Vk%20music%20downloader/OpenSave/opensave.swf",
			filename: "",
			url: "",
			buttonDiv: ""
		};

	function loadScript(url, callback){
		var script = document.createElement("script");

		script.type = "text/javascript";
		if (script.readyState){
			script.onreadystatechange = function(){
				if (script.readyState == "loaded" || script.readyState == "complete"){
						script.onreadystatechange = null;
						callback();
				}
			}
		}
		else {
			script.onload = function(){
				callback();
			};
		}

		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	function setCss(cssString){
		var head = document.head || document.getElementsByTagName("head")[0],
			style = document.createElement("style");

		style.type = "text/css";
		if (style.styleSheet){
			style.styleSheet.cssText = cssString;
		}
		else{
			style.appendChild(document.createTextNode(cssString));
		}

		head.appendChild(style);
	}

	function getContent(innerHTML){
		return innerHTML.replace(/<[^>]*>/g, "");
	}

	function each($elements, callback){
		for(var i=0; i<$elements.length; i++){
			callback($elements[i]);
		}
	}

	function getDownloadLink(event){
		var $audios = document.querySelectorAll(".audio:not(#audio_global)");

		each($audios, function ($this){
			if(!$this.querySelectorAll(".vkDownloadWrap")[0]){
				var $dContainer = $this.querySelector(".title_wrap"),
					dUrl = ($this.querySelector("input")).value.replace(/\?.*/g, ""),
					dTitleAuthor = getContent( ($this.querySelectorAll("b a")[0]).innerHTML ),
					dTitleSong = getContent( ($this.querySelectorAll("span.title")[0]).innerHTML ),
					dFullTitle = (dTitleAuthor +" - "+ dTitleSong).replace(/^\s*|\s*$/gm, "").substr(0, 255).replace(/[/\\:*?"<>|%@]/gm, " "),
					dWrap = document.createElement("a"),
					dBtn = document.createElement("span");

				audioBtnOptions.filename = dFullTitle +".mp3";
				audioBtnOptions.url = dUrl;
				audioBtnOptions.buttonDiv = "vkDownload" + audioCounter;

				dWrap.className = "vkDownloadWrap";
				dBtn.id = "vkDownload" + audioCounter;
				dWrap.appendChild(dBtn);
				$dContainer.insertBefore(dWrap, $dContainer.childNodes[0]);


				opensave.make(audioBtnOptions);

				audioCounter++;
			}
		});
	}

	loadScript(swfScriptUrl, function(){
		setCss(".vkDownloadWrap{float: left; margin: -3px 2px 0 0; z-index: 999999; width: 20px; height: 20px;} .area{position: relative;} .audio_fixed_nav #page_header, .audio_fixed_nav #ac{z-index: 999999999999;}");

		getDownloadLink();

		document.addEventListener("scroll", getDownloadLink);

		console.info("Script loaded and started!");
	});
})();
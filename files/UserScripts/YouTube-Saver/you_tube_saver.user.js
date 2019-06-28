// ==UserScript==
// @version         3.0
// @name            YouTube -> download MP3 or Video from YouTube.
// @namespace       https://greasyfork.org/ru/scripts/386967-youtube-download-mp3-or-video-from-youtube
// @author			A.Vasin
// @description     Simple YouTube MP3 & MP4 download buttons. Simple and fast.
// @compatible      chrome
// @compatible      firefox
// @compatible      opera
// @compatible      safari
// @icon            https://avasin.ml/UserScripts/YouTube-Saver/logo.png
// @include         http*://www.youtube.com/*
// @include      	http*://*.youtube.com/*
// @include      	http*://youtube.com/*
// @include      	http*://*.youtu.be/*
// @include      	http*://youtu.be/*
// @run-at       	document-idle
// @copyright   	2019-02-11 // a.vasin
// @license         https://creativecommons.org/licenses/by-sa/4.0
// @updateURL		https://avasin.ml/UserScripts/YouTube-Saver/you_tube_saver.user.js
// ==/UserScript==

class YouTubeSaver {
    constructor() {
        this.btnHolderSel = '#meta-contents #subscribe-button';
        this.downloadBtnClass = 'js-ytube-download';
        this.downloadAudioClass = 'js-mp3-download';
        this.audioServiceBaseUrl = 'https://svr2.flvto.tv/downloader/state?id=';
        this.baseServiceUrl = 'https://www.saveclipbro.com/convert?';
        this.initInterval = 400;
        this.checkInterval = 1000;
        this.btnSize = '10px';
        this.btnPadding = '10px 5px';
        this.language = (navigator.language || navigator.userLanguage).split('-')[0];
        this.loaderHtml = '<div class="loader"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>';
        this.langProps = {
            en: {
                'download.mp3': 'Download MP3',
                'download.video': 'Download VIDEO',
                'download': 'Download'
            },
            ru: {
                'download.mp3': 'Скачать MP3',
                'download.video': 'Скачать ВИДЕО',
                'download': 'Скачать'
            }
        }
        this.currentProps = this.langProps[this.language] || this.langProps.en;

        this.init();
    }

    getAudioBtnHtml(link) {
        const downloadUrl = this.getAudioDownloadUrl({url: link});

        if(!downloadUrl) {
            return '';
        }

        return `
            <a
                href="${downloadUrl}"
                target="_blank"
                class="${this.downloadBtnClass} ${this.downloadAudioClass}"
            >
                ${this.loaderHtml}
                ${this.getLangProp('download.mp3')}
            </a>
        `;
    }

    getGenBtnHtml(link) {
        const downloadUrl = this.getBaseDownloadUrl({url: link});

        return `
            <a
                href="${downloadUrl}"
                target="_blank"
                class="${this.downloadBtnClass}"
            >
                ${this.getLangProp('download')}
            </a>
        `;
    }

    init() {
        this.addDownloadIframe();
        this.addStyles();

        this.initDownloadBtn();
    }
    
    initDownloadBtn() {
        setInterval(() => {
            const appendToEl = document.querySelector(this.btnHolderSel);
            const downloadBtn = document.querySelector(`.${this.downloadBtnClass}`);
            
            // Append download buttons in case download mp3 button not available
            // && placeholder exist on page
            if(!downloadBtn && appendToEl) {
                this.appendBtns(appendToEl);
            }
        }, this.initInterval);
    }

    bindEvents(ctx) {
        const audioBtn = ctx.querySelector(`.${this.downloadAudioClass}`);

        audioBtn && audioBtn.addEventListener('click', this.onAudioDownload.bind(this, audioBtn));
    }

    addStyles() {
        const style = document.createElement('style');
        const css = `
            .${this.downloadBtnClass} {
                position: relative;
                border: 2px solid #3f51b5;
                padding: ${this.btnPadding};
                font-size: ${this.btnSize};
                font-weight: 500;
                text-align: center;
                margin: 5px 4px 0;
                color: #3f51b5;
                text-decoration: none;
                flex-grow: 1;
                text-transform: uppercase;
            }

            .${this.downloadAudioClass} {
                border-color: #ff5722;
                color: #ff5722;
            }
            .loading {
                pointer-events: none;
                color: transparent;
            }
            .loading .loader {
                display: block;
            }
            .loader {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                font-size: 10px;
            }
            .loader>div {
                background-color: #ff5722;
                height: 100%;
                width: 6px;
                margin: 0 1px;
                display: inline-block;
                animation: sk-stretchdelay 1.2s infinite ease-in-out;
            }
            .loader .rect2 {
                animation-delay: -1.1s;
            }
            .loader .rect3 {
                animation-delay: -1.0s;
            }
            .loader .rect4 {
                animation-delay: -0.9s;
            }
            .loader .rect5 {
                animation-delay: -0.8s;
            }
            @keyframes sk-stretchdelay {
                0%,
                40%,
                100% {
                    transform: scaleY(0.4);
                }
                20% {
                    transform: scaleY(1.0);
                }
            }

        `;

        style.appendChild(document.createTextNode(css));
        document.body.append(style);
    }

    addDownloadIframe() {
        this.downloadFrame = document.createElement('iframe');
        document.body.append(this.downloadFrame);
    }

    getLangProp(id) {
        return this.currentProps[id];
    }

    getAudioDownloadUrl({url} = {}) {
        const id = this.getVideoId(url);

        if(!id) {
            console.warn('Video ID not found/parsed.');
            return id;
        }

        return `${this.audioServiceBaseUrl}${id}`;
    }
    
    getBaseDownloadUrl({url} = {}) {
        return `${this.baseServiceUrl}main_search[linkToDownload]=${encodeURIComponent(url)}`;
    }

    getNodeFromString(string) {
        const div = document.createElement('div');
        div.innerHTML = string.trim();

        return div.firstChild;
    }

    getVideoId(url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = url.match(regExp);
        return (match && match[7].length==11) ? match[7] : false;
    }

    appendBtns(appendToEl) {
        const url = document.location.href;
        const audioBtnHtml = this.getAudioBtnHtml(url);
        const genBtnHtml = this.getGenBtnHtml(url);
        const downloadWrapper = this.getNodeFromString(`
            <div style="
                display: flex;
            ">
                ${audioBtnHtml}
                ${genBtnHtml}
            </div>
        `);

        //append buttons to the page
        appendToEl.append(downloadWrapper);
        this.bindEvents(appendToEl);
    }

    downloadFile(url, btn) {
        this.downloadFrame.onerror = this.downloadFailed.bind(this, btn);
        this.downloadFrame.onload = () => {
            if(!this.downloadFrame.innerHTML) {
                this.downloadFailed(btn);
                this.downloadFrame.onload = null;
                this.downloadFrame.onerror = null;
            }
        };
        this.downloadFrame.src = url;
    }

    onAudioDownload(btn, e) {
        e.preventDefault();
        const _this = this;
        const url = btn.href;

        this.toggleLoader(btn);

        fetch(url)
            .then(resp => resp.json())
            .then(({dlMusic, status}) => {
                if(status === 'finished') {
                    _this.downloadFile(dlMusic, btn);
                    setTimeout(_this.toggleLoader.bind(_this, btn, false), 500);
                } else {
                    setTimeout(_this.onAudioDownload.bind(_this, btn, e), _this.checkInterval);
                }
            })
            .catch(_this.downloadFailed.bind(_this, btn));
    }

    downloadFailed(btn) {
        const alternativeBtn = btn.nextElementSibling;
        this.toggleLoader(btn, false);

        // Try alternative download BTN
        if (alternativeBtn) {
            alternativeBtn.click();
        }
    }

    toggleLoader(btn, isActivate = true, msg) {
        if(btn) {
            btn.classList.toggle('loading', isActivate);

            if(msg) {
                btn.innerText = msg;
            }
        }
    }
}

// Init downloader
const saver = new YouTubeSaver();

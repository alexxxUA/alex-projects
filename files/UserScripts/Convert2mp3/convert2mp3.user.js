// ==UserScript==
// @version         1.1
// @name            YouTube -> download MP3 or MP4 from YouTube. convert2mp3.net
// @namespace       http://avasin.ml
// @author			A.Vasin
// @description     Simple YouTube MP3 & MP4 download buttons. Simple and fast.
// @compatible      chrome
// @compatible      firefox
// @compatible      opera
// @compatible      safari
// @icon            http://convert2mp3.net/favicon.ico
// @match           http*://www.youtube.com/*
// @include      	http*://*.youtube.com/*
// @include      	http*://youtube.com/*
// @include      	http*://*.youtu.be/*
// @include      	http*://youtu.be/*
// @run-at       	document-end
// @copyright   	2019-02-11 // a.vasin
// @license         https://creativecommons.org/licenses/by-sa/4.0
// @updateURL		http://avasin.ml/UserScripts/Convert2mp3/convert2mp3.user.js
// ==/UserScript==

class Convert2mp3 {
    constructor() {
        this.btnHolderSel = '#meta-contents #subscribe-button';
        this.downloadBtnClass = 'js-ytube-download';
        this.serviceBaseUrl = 'https://www.saveclipbro.com/convert?';
        this.initInterval = 400;
        this.btnSize = '10px';
        this.btnPadding = '10px 5px';
        this.language = (navigator.language || navigator.userLanguage).split('-')[0];
        this.langProps = {
            en: {
                'download.mp3': 'DOWNLOAD MP3',
                'download.mp4': 'DOWNLOAD MP4',
                'download': 'DOWNLOAD'
            },
            ru: {
                'download.mp3': 'СКАЧАТЬ MP3',
                'download.mp4': 'СКАЧАТЬ MP4',
                'download': 'СКАЧАТЬ'
            }
        }
        this.currentProps = this.langProps[this.language] || this.langProps.en;

        this.init();
    }

    getBtnHtml(link) {
        const downloadUrl = this.getDownloadUrl({url: link});

        return `
            <a
                href="${downloadUrl}"
                target="_blank"
                class="${this.downloadBtnClass}"
                style="
                    border: 2px solid #3f51b5;
                    padding: ${this.btnPadding};
                    font-size: ${this.btnSize};
                    font-weight: 500;
                    text-align: center;
                    margin: 5px 4px 0;
                    color: #3f51b5;
                    text-decoration: none;
                    flex-grow: 1;
                "
            >
                ${this.getLangProp('download')}
            </a>
        `;
    }

    init() {
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

    getLangProp(id) {
        return this.currentProps[id];
    }
    
    getDownloadUrl({url} = {}) {
        return `${this.serviceBaseUrl}main_search[linkToDownload]=${encodeURIComponent(url)}`;
    }

    getNodeFromString(string) {
        const div = document.createElement('div');
        div.innerHTML = string.trim();

        return div.firstChild;
    }

    appendBtns(appendToEl) {
        const url = document.location.href;
        const btnHtml = this.getBtnHtml(url);
        const downloadWrapper = this.getNodeFromString(`
            <div style="
                display: flex;
            ">
                ${btnHtml}
            </div>
        `);

        //append buttons to the page
        appendToEl.append(downloadWrapper);
    }
}

// Init downloader
const converter = new Convert2mp3();

// ==UserScript==
// @version         0.1
// @name            Convert2mp3 -> download mp3 from YouTube | convert2mp3.net
// @author			A.Vasin
// @description     Simple YouTube MP3 download button which use service "convert2mp3.net"
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
        this.downloadBtnClass = 'convert-2mp3-btn';
        this.serviceBaseUrl = 'http://convert2mp3.net/addon_call.php';
        this.initInterval = 400;
        this.btnSize = '10px';
        this.btnPadding = '10px 5px';
        this.language = (navigator.language || navigator.userLanguage).split('-')[0];
        this.langProps = {
            en: {
                'download.mp3': 'DOWNLOAD MP3',
                'download.mp4': 'DOWNLOAD MP4'
            },
            ru: {
                'download.mp3': 'СКАЧАТЬ MP3',
                'download.mp4': 'СКАЧАТЬ MP4'
            }
        }

        this.init();
    }

    getMp3Html(link) {
        const downloadUrl = this.getDownloadUrl({format: 'mp3', url: link});

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
                ${this.getLangProp('download.mp3')}
            </a>
        `;
    }

    getMp4Html(link) {
        const downloadUrl = this.getDownloadUrl({format: 'mp4', url: link});

        return `
            <a
                href="${downloadUrl}"
                target="_blank"
                class="${this.downloadBtnClass}"
                style="
                    border: 2px solid #ff9800;
                    padding: ${this.btnPadding};
                    font-size: ${this.btnSize};
                    font-weight: 500;
                    text-align: center;
                    margin: 5px 4px 0;
                    color: #ff9800;
                    text-decoration: none;
                    flex-grow: 1;
                "
            >
            ${this.getLangProp('download.mp4')}
            </a>
        `;

        /* return `
            <select
                onchange="window.open('${downloadUrl}&quality='+ this.value)"
                target="_blank"
                class="${this.downloadBtnClass}"
                style="
                    border: 2px solid #ff9800;
                    padding: 10px;
                    font-size: 15px;
                    font-weight: 500;
                    text-align: center;
                    margin: 5px 4px 0;
                    color: #ff9800;
                    text-decoration: none;
                "
            >
                <option>DOWNLOAD MP4</option>
                <option value="1080">1080</option>
                <option value="720">720</option>
                <option value="480">480</option>
                <option value="360">360</option>
            </select>
        `; */
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
        const props = this.langProps[this.language] || this.langProps.en;

        return props[id];
    }
    
    getDownloadUrl(params = {}) {
        const paramString = Object.keys(params).map(param => `${param}=${encodeURIComponent(params[param])}`).join('&');

        return `${this.serviceBaseUrl}?${paramString}`;
    }

    getNodeFromString(string) {
        const div = document.createElement('div');
        div.innerHTML = string.trim();

        return div.firstChild;
    }

    appendBtns(appendToEl) {
        const url = document.location.href;
        const mp3Html = this.getMp3Html(url);
        const mp4Html = this.getMp4Html(url);
        const downloadWrapper = this.getNodeFromString(`
            <div style="
                display: flex;
            ">
                ${mp3Html}
                ${mp4Html}
            </div>
        `);

        //append buttons to the page
        appendToEl.append(downloadWrapper);
    }
}

// Init downloader
const converter = new Convert2mp3();

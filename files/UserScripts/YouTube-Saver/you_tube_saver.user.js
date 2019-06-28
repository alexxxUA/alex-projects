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
// @grant           GM_download
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
        this.configregExp = /ytplayer\.config\s*=/i;
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
        this.domParser = new DOMParser();
        this.parsingInProgress = false;

        this.init();
    }

    getVideoUrls(url) {
        return this.getConfig(url)
            .then(config => {
                if(config) {
                    return config.args.adaptive_fmts
                        .split(',')
                        .map(item => item
                            .split('&')
                            .reduce((prev, curr) => (curr = curr.split('='),
                            Object.assign(prev, {[curr[0]]: decodeURIComponent(curr[1])})
                            ), {})
                        )
                        .reduce((prev, curr) => Object.assign(prev, {
                            [curr.quality_label || curr.type]: curr
                        }), {});
                } else {
                    return false;
                }
            })
    }

    getConfig(url) {
        const _this = this;

        return fetch(url)
            .then(resp => resp.text())
            .then(res => {
                const dom = _this.domParser.parseFromString(res, "text/html");
                const scripts = dom.querySelectorAll('script');
                const confEl = [...scripts].find(el => el.innerHTML.match(this.configregExp));

                eval(confEl.innerHTML);

                return ytplayer && ytplayer.config;
            });
    }

    testDownload() {
        GM_download("https://r4---sn-nf5o-cune.googlevideo.com/videoplayback?expire=1561749377&ei=IBMWXduQMoj51wLcgZtA&ip=195.12.152.88&id=o-AFF6xZzDK3_wOUMqc4P5ONNWI5E65-ZQuKJmmQ60Sgmo&itag=140&source=youtube&requiressl=yes&mm=31%2C29&mn=sn-nf5o-cune%2Csn-2gb7sn7s&ms=au%2Crdu&mv=m&pcm2cms=yes&pl=19&initcwndbps=1045000&mime=audio%2Fmp4&gir=yes&clen=21054817&dur=1325.627&lmt=1534545037774971&mt=1561727637&fvip=6&keepalive=yes&c=WEB&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=ALgxI2wwRQIgFc1e7n1uY0vCC1YaadcGKfdOsIMbEd468R0uDMclVW8CIQDzybMuqpR_Vsld_IcO0OT5ygFofThEnfzsQCnsXujTAg%3D%3D&lsparams=mm%2Cmn%2Cms%2Cmv%2Cpcm2cms%2Cpl%2Cinitcwndbps&lsig=AHylml4wRQIgVl7VTXFG3rRFzcdF0RQYu_H2YjOB6YxSSQCcK8tSBUYCIQD2qq8S76CFVT6q3d3DrYUGarL2wu2am-QhBBA554leCg%3D%3D", 'Test.mp3');
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

    getBtn({
        href,
        classNames = this.downloadBtnClass,
        color = '#3f51b5',
        propId = 'download'
    }) {
        return `
            <a
                href="${href}"
                target="_blank"
                class="${classNames}"
                style="color: ${color}; border-color: ${color}"
            >
                ${this.getLangProp(propId)}
            </a>
        `;
    }

    init() {
        this.addStyles();

        this.initDownloadBtn();
    }
    
    initDownloadBtn() {
        setInterval(() => {
            const appendToEl = document.querySelector(this.btnHolderSel);
            const downloadBtn = document.querySelector(`.${this.downloadBtnClass}`);
            
            // Append download buttons in case download mp3 button not available
            // && placeholder exist on page
            if(!downloadBtn && appendToEl && !this.parsingInProgress) {
                this.parsingInProgress = true;
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
                text-decoration: none;
                flex-grow: 1;
                text-transform: uppercase;
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

    findUrlByType(conf, type) {
        const key = Object.keys(conf).find(item => item.includes(type));

        return key && conf[key] && conf[key].url;
    }

    async appendBtns(appendToEl) {
        const url = document.location.href;
        const videoUrls = await this.getVideoUrls(url);
        const audioUrl = this.findUrlByType(videoUrls, 'audio/mp4');
        const videoUrl = this.findUrlByType(videoUrls, '720p');

        console.log(videoUrls);
        
        const audioBtnHtml = this.getBtn({href: audioUrl, color: '#ff5722', propId: 'download.mp3', classNames: `${this.downloadBtnClass} ${this.downloadAudioClass}`});
        const videoBtnHtml = this.getBtn({href: videoUrl, color: '#3f51b5', propId: 'download.video', classNames: `${this.downloadBtnClass}`});
        const downloadWrapper = this.getNodeFromString(`
            <div style="
                display: flex;
            ">
                ${audioBtnHtml}
                ${videoBtnHtml}
            </div>
        `);

        //append buttons to the page
        appendToEl.append(downloadWrapper);
        this.bindEvents(appendToEl);
        this.parsingInProgress = false;
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

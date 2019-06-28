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
        this.configRegExp = /ytplayer\.config\s*=/i;
        this.baseServiceUrl = 'https://www.saveclipbro.com/convert?';
        this.initInterval = 400;
        this.checkInterval = 1000;
        this.btnSize = '10px';
        this.btnPadding = '10px 5px';
        this.defBtnColor = '#ff5722';
        this.audioConf = {format: 'audio/mp4', ext: 'mp3'};
        this.language = (navigator.language || navigator.userLanguage).split('-')[0];
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
            if(!downloadBtn && appendToEl) {
                this.appendBtns(appendToEl);
            }
        }, this.initInterval);
    }

    bindEvents(ctx) {
        const btns = ctx.querySelectorAll('[data-format]');

        if(btns && btns.length) {
            btns.forEach(btn => btn.addEventListener('click', this.onDownload.bind(this, btn)))
        }
    }

    addStyles() {
        const style = document.createElement('style');
        const css = `
            .${this.downloadBtnClass} {
                position: relative;
                border: 2px solid ${this.defBtnColor};
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
                font-size: 0;
                background: #FFF;
            }
            .loader>div {
                background-color: ${this.defBtnColor};
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

    appendBtns(appendToEl) {
        const audioBtnHtml = this.getAudioBtnHtml();
        const genBtnHtml = this.getGenBtnHtml(document.location.href);
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

    getLangProp(id) {
        return this.currentProps[id];
    }

    getVideoData(url) {
        return this.fetchConfig(url)
            .then(config => {
                if(config) {
                    const mediaObj = config.args.adaptive_fmts.split(',')
                        .map(item => item
                            .split('&')
                            .reduce((prev, curr) => (curr = curr.split('='),
                            Object.assign(prev, {[curr[0]]: decodeURIComponent(curr[1])})
                            ), {})
                        )
                        .reduce((prev, curr) => Object.assign(prev, {
                            [curr.quality_label || curr.type]: curr
                        }), {});

                    return {
                        mediaObj,
                        title: config.args.title
                    }
                } else {
                    return {};
                }
            })
    }

    getBtn({
        href = '#',
        classNames = this.downloadBtnClass,
        color = this.defBtnColor,
        propId = 'download',
        format,
        ext
    }) {
        return `
            <a
                ${ href ? `href="${href}"` : ''}
                ${ format ? `data-format="${format}"` : ''}
                ${ ext ? `data-ext="${ext}"` : ''}
                target="_blank"
                class="${classNames}"
                style="color: ${color}; border-color: ${color}"
            >
                ${this.getLangProp(propId)}
                <div class="loader">
                    <div class="rect1" style="background-color: ${color}"></div>
                    <div class="rect2" style="background-color: ${color}"></div>
                    <div class="rect3" style="background-color: ${color}"></div>
                    <div class="rect4" style="background-color: ${color}"></div>
                    <div class="rect5" style="background-color: ${color}"></div>
                </div>
            </a>
        `;
    }

    getAudioBtnHtml() {
        return this.getBtn({
            ...this.audioConf,
            propId: 'download.mp3',
            classNames: `${this.downloadBtnClass} ${this.downloadAudioClass}`
        });
    }

    getGenBtnHtml(link) {
        return this.getBtn({
            href: this.getGenDownloadUrl({url: link}),
            propId: 'download',
            classNames: `${this.downloadBtnClass}`,
            color: '#3f51b5'
        });
    }

    getGenDownloadUrl({url} = {}) {
        return `${this.baseServiceUrl}main_search[linkToDownload]=${encodeURIComponent(url)}`;
    }

    getNodeFromString(string) {
        const div = document.createElement('div');
        div.innerHTML = string.trim();

        return div.firstChild;
    }

    fetchConfig(url) {
        const _this = this;

        return fetch(url)
            .then(resp => resp.text())
            .then(res => {
                const dom = _this.domParser.parseFromString(res, "text/html");
                const scripts = dom.querySelectorAll('script');
                const confEl = [...scripts].find(el => el.innerText.match(this.configRegExp));

                if(confEl) {
                    eval(confEl.innerText);
                }

                return ytplayer && ytplayer.config;
            });
    }

    findUrlByType(conf = {}, type) {
        const key = Object.keys(conf).find(item => item.includes(type));

        return key && conf[key] && conf[key].url;
    }

    onDownload(btn, e) {
        e.preventDefault();
        const _this = this;
        const url = document.location.href;

        // Show loader
        this.toggleLoader(btn);

        // Fetch URLs data
        return this.getVideoData(url)
            .then(({mediaObj, title}) => {
                const { format, ext } = btn.dataset;
                const audioUrl = _this.findUrlByType(mediaObj, format);

                if(audioUrl) {
                    // Start downloading
                    GM_download(audioUrl, `${title}.${ext}`);
                    // Hide loader
                    setTimeout(_this.toggleLoader.bind(_this, btn, false), 1000);
                } else {
                    throw new Error('Audio URL not found');
                }
            })
            .catch(msg => {
                console.error(msg);
                _this.downloadFailed.call(_this, btn);
            });
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

        if(!isActivate) {
            delete unsafeWindow.ytplayer;
        }
    }
}

// Init downloader
const saver = new YouTubeSaver();

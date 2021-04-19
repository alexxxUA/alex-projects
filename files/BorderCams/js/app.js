class ServiceWorker {
    constructor() {
        this.swUrl = '/sw.js';
        this.init();
    }

    init() {
        if(navigator.serviceWorker && !navigator.serviceWorker.controller) {
            return navigator.serviceWorker.register(this.swUrl).then(function() {
                console.info('Service worker registered');
            })
        }
    }
}

class ProxyParser {
    constructor() {
        this.proxyHref = '/proxy?url=';
        this.proxyUrl = `${location.origin}${this.proxyHref}`;
        this.domParser = new DOMParser();
    }

    doProxyFetch(url, isForceDecode = false) {
        return fetch(`${this.proxyUrl}${url}${isForceDecode ? '&decode=true' : ''}`)
            .then(resp => resp.text());
    }

    doPageFetch(url, isForceDecode = false) {
        return this.doProxyFetch(url, isForceDecode)
            .then(this.blockResources)
            .then(this.convertHtmlToDom.bind(this));
    }

    blockResources(html) {
        return html
            .replace(/src=/gm, 'x-src=')
            .replace(/href=/gm, 'x-href=');
    }

    convertHtmlToDom(html) {
        return this.domParser.parseFromString(html, 'text/html');
    }
}

class BorderCams extends ProxyParser {
    constructor() {
        super();
        this.camsUrl = 'https://dpsu.gov.ua/ua/border/';
        this.textBorderDataUrl = 'https://www.financnasprava.sk/sk/infoservis/hranicne-priechody';
        this.camSel = {
            countries: '[data-id="select-country"] option',
            checkpoints: '[data-id="select-town"] option'
        };
        this.textDataSel = {
            borders: '#tblPriechody tbody tr'
        };
        this.textDataIdMap = {
            'UZHGOROD1': 'нємецьке|німецьке|nemecké|nemecke',
            'uzhgorod': 'нємецьке|німецьке|nemecké|nemecke',
            'm_berezny': 'убля|ubľa|m_berezny'
        };
        this.favoritePoints = ['UZHGOROD1', 'uzhgorod', 'm_berezny', '007_Tisa_rear'];

        this.predefinedPoints = {
            slovakia: [
                {
                    id: 'uzhgorod',
                    name: 'Ужгород-КПП - Вишнє-Немецьке',
                    src: 'https://stream.dpsu.gov.ua:5101/uzhgorod/embed.html?dvr=false&proto=hls&autoplay=true'
                }
            ]
        };

        this.translateMap = {
            'звичайний': 'priebežne|priebezne'
        };

        this.init();
    }

    init() {
        const isMobile = window.orientation !== undefined;

        document.body.classList.add(isMobile ? 'mobile' : 'desktop');
        this.renderApp();
    }

    async renderApp(){
        const _this = this;
        const [camsData, textData] = await this.getData();

        Vue.component('border-cams', {
            data () {
                const data = {
                    camsData: {},
                    favoritePoints: _this.favoritePoints,
                    favoriteItems: [],
                    err: null,
                    streamSrc: null,
                    textData,
                    textBorderDataUrl: _this.textBorderDataUrl
                };

                if(camsData) {
                    data.camsData = camsData;

                    data.favoriteItems = _this.getCamsDataById(camsData, _this.favoritePoints);

                    // Activate first camera
                    if (data.favoriteItems.length) {
                        data.streamSrc = data.favoriteItems[0].src;
                    }
                } else {
                    data.err = 'Камери тимчасово недоступні 🤕, cпробуйте пізніше.'
                }

                return data;
            },

            computed: {
                activeCamData() {
                    let data;

                    if(this.streamSrc) {
                        data = this.favoriteItems.find(item => item.src === this.streamSrc);
                        const textData = this.textData[data.id];

                        if(textData && Object.keys(textData).length) {
                            Object.assign(data, textData, {
                                textData: true
                            });
                        }
                    }

                    return data;
                },

                streamSrcFormatted() {
                    return `javascript:window.location.replace('${this.streamSrc}');`;
                }
            },

            methods: {
                selectCam(streamSrc) {
                    // Return in case same ID was selected
                    if (this.streamSrc === streamSrc) {
                        return;
                    }

                    this.streamSrc = streamSrc;

                    // Switch animation
                    clearTimeout(this.animationTimeout);
                    this.$refs.streamWrap.classList.add('m-switch');
                    this.animationTimeout = setTimeout(() => {
                        this.$refs.streamWrap.classList.remove('m-switch');
                    }, 700);
                },

                onCamLoad(e) {
                    if (e.currentTarget.src != this.streamSrc) {
                        e.currentTarget.src = this.streamSrc;
                    }
                },

                translate(text) {
                    let translated = text;

                    Object.keys(_this.translateMap).forEach(key => {
                        const regExp = new RegExp(_this.translateMap[key], 'igm');

                        translated = translated.replace(regExp, key);
                    });

                    return translated;
                }
            },

            mounted() {
                console.log('mounted')
            },
            ready() {
                console.log('ready')
            },
            created() {
                console.log('created')
            }
        });
        
        new Vue({
            el: '#app'
        });
    }

    alphabetSort(prop, a, b) {
        if(a[prop] < b[prop]) { return 1; }
        if(a[prop] > b[prop]) { return -1; }
        return 0;
    }

    getData() {
        const camsDataPromise = this.doPageFetch(this.camsUrl, true)
            .then(this.parseCamsData.bind(this))
            .then(this.mergeCamsData.bind(this));
        const textDataPromise = this.doPageFetch(this.textBorderDataUrl)
            .then(this.parseTextBorderData.bind(this));
        return Promise.all([camsDataPromise, textDataPromise]);
    }

    mergeCamsData(camsData) {
        const mergedCamsData = camsData;

        Object.keys(this.predefinedPoints).forEach(key => {
            if(!mergedCamsData[key]){
                mergedCamsData[key] = {checkpoints: []};
            }

            mergedCamsData[key].checkpoints = mergedCamsData[key].checkpoints.concat(this.predefinedPoints[key]);
        });

        return mergedCamsData;
    }

    getCamsDataById(camGroups, id) {
        const idArr = typeof id === 'string' ? [ id ] : id;
        const camsList = [];

        idArr.forEach(id => {
            let cam;
            const camGroupsKeys = Object.keys(camGroups);
            for(let i = 0; i < camGroupsKeys.length; i++) {
                const camCheckpoints = camGroups[camGroupsKeys[i]].checkpoints;
                for(let j = 0; j < camCheckpoints.length; j++) {
                    const currentCam = camCheckpoints[j];
                    if(currentCam.id === id) {
                        camsList.push(currentCam);
                        cam = currentCam;
                        break;
                    }
                }
                if(cam) break;
            }
        });

        return camsList;
    }

    parseCamsData(dom) {
        let countries = {};
        const countriesEl = dom.querySelectorAll(this.camSel.countries);
        const checkpointsEl = dom.querySelectorAll(this.camSel.checkpoints);

        if(!countriesEl.length || !checkpointsEl.length) {
            this.error(`${this.camSel.countries} or ${this.camSel.checkpoints} not found on source page!`);
            return countries;
        }

        countries = Array.prototype.reduce.call(countriesEl, (obj, {value, text}) => {
            obj[value] = {
                name: text.trim(),
                checkpoints: []
            }
            return obj;
        }, {});

        // Add checkpoints to the countries
        checkpointsEl.forEach(({value, text, dataset : { link }}) => {
            if(countries[value]) {
                const checkpointData = {
                    id: this.getIdFromUrl(link) || text,
                    name: text,
                    src: this.updateStreamSrc(link)
                };

                countries[value].checkpoints.push(checkpointData);
            }
        });

        return countries;
    }

    getIdFromUrl(url) {
        let id;
        const regExpResult = /\/([^\/:]+)\//.exec(url);

        if(regExpResult && regExpResult.length > 1) {
            id = regExpResult[1];
        }

        return id;
    }

    parseTextBorderData(dom) {
        const borders = dom.querySelectorAll(this.textDataSel.borders);

        if(!borders || borders.length === 0) {
            this.error('Text data for SK borders not found.');
            return {};
        }

        return [...borders].reduce((bordersObj, borderItem) => {
            const dataMap = {
                name2: 'td:nth-child(1)',
                waitTimeToEU: 'td:nth-child(3)',
                waitTimeToUA: 'td:nth-child(6)',
                note: 'td:nth-child(8)',
                updatedTime: 'td:nth-child(9)'
            };
            const data = Object.keys(dataMap).reduce((obj, key) => {
                obj[key] = borderItem.querySelector(dataMap[key]).innerText.trim();
                return obj;
            }, {});
            const ids = this.findIdsByNameFromMap(data.name2);

            if(ids.length) {
                ids.forEach(id => bordersObj[id] = data);
            } else {
                this.error(`Id not found for text data for: "${data.name2}"`);
            }

            return bordersObj;
        }, {});
    }

    updateStreamSrc(src) {
        const srcObj = new URL(src);

        // Set autoplay
        if(!srcObj.searchParams.get('autoplay')) {
            srcObj.searchParams.set('autoplay', true);
        }

        if(!srcObj.searchParams.get('mute')) {
            srcObj.searchParams.set('mute', true);
        }

        return srcObj.href;
    }

    findIdsByNameFromMap(name) {
        const idArray = [];

        Object.keys(this.textDataIdMap).forEach(key => {
            const regExp = new RegExp(this.textDataIdMap[key], 'i');
            if(regExp.test(name)) {
                idArray.push(key);
            }
        });

        return idArray;
    }

    error(msg) {
        console.error(msg);
    }
}

// Register Service Worker
const sw = new ServiceWorker();

// Init App
const borderCams = new BorderCams();

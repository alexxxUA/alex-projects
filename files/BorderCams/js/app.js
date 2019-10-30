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

    doProxyFetch(url) {
        return fetch(`${this.proxyUrl}${url}`)
            .then(resp => resp.text());
    }

    doPageFetch(url) {
        return this.doProxyFetch(url)
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
            countries: '[data-id="country"] option',
            checkpoints: '[data-id="puncts"] option'
        };
        this.textDataSel = {
            borders: '#tblPriechody tbody tr'
        };
        this.slugMap = {
            VN: 'нємецьке|німецьке|nemecké|nemecke',
            UBLA: 'убля|ubľa|ubla',
            SLME: 'селменце|slemence'
        };
        this.favoriteCountry = 'slovakia';

        this.translateMap = {
            'звичайний': 'priebežne|priebezne'
        };

        this.init();
    }

    init() {
        if (window.orientation !== undefined) {
            document.body.classList.add('mobile');
        }

        this.renderApp();
    }

    async renderApp(){
        const _this = this;
        const [camsData, textData] = await this.getData();

        Vue.component('border-cams', {
            data () {
                const data = {
                    camsData: {},
                    favoriteItems: [],
                    err: null,
                    streamSrc: null,
                    textData,
                    textBorderDataUrl: _this.textBorderDataUrl
                };

                if(camsData) {
                    const favoriteCountry = camsData[_this.favoriteCountry];
                    if (favoriteCountry) {
                        data.favoriteItems = favoriteCountry.checkpoints
                            .filter(({name}) => !name.includes('вантаж'))
                            .sort(_this.alphabetSort.bind(_this, 'name'));
                        data.streamSrc = data.favoriteItems[0].src;
                    }
                    data.camsData = camsData;
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
                        Object.assign(data, this.textData[data.slug]);
                    }

                    return data;
                }
            },

            methods: {
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
        const camsDataPromise = this.doPageFetch(this.camsUrl).then(this.parseCamsData.bind(this));
        const textDataPromise = this.doPageFetch(this.textBorderDataUrl).then(this.parseTextBorderData.bind(this));
        return Promise.all([camsDataPromise, textDataPromise]);
    }

    parseCamsData(dom) {
        const countriesEl = dom.querySelectorAll(this.camSel.countries);
        const checkpointsEl = dom.querySelectorAll(this.camSel.checkpoints);

        if(!countriesEl.length || !checkpointsEl.length) {
            this.error(`${this.camSel.countries} or ${this.camSel.checkpoints} not found on source page!`);
            return null;
        }

        const countries = Array.prototype.reduce.call(countriesEl, (obj, {value, text}) => {
            obj[value] = {
                name: text.trim(),
                checkpoints: []
            }
            return obj;
        }, {});

        // Add checkpoints to the countries
        checkpointsEl.forEach(({value, text, dataset}) => {
            if(countries[value]) {
                const checkpointData = {
                    name: text,
                    src: this.updateStreamSrc(dataset.link)
                };
                const slug = this.findSlugByName(text);

                // Try to find slug
                if(slug) {
                    checkpointData.slug = slug;
                }

                countries[value].checkpoints.push(checkpointData);
            }
        });

        return countries;
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
            const slug = this.findSlugByName(data.name2);

            if(slug) {
                bordersObj[slug] = data;
            } else {
                this.error(`Slug not found for text data for: "${data.name2}"`);
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

        return srcObj.href;
    }

    findSlugByName(name) {
        let slug;

        Object.keys(this.slugMap).forEach(key => {
            const regExp = new RegExp(this.slugMap[key], 'i');
            if(regExp.test(name)) {
                slug = key;
            }
        });

        return slug;
    }

    error(msg) {
        console.error(msg);
    }
}

// Register Service Worker
const sw = new ServiceWorker();

// Init App
const borderCams = new BorderCams();

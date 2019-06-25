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
        this.countriesSel = '[data-id="country"] option';
        this.checkpointsSel = '[data-id="puncts"] option';
        this.favoriteCountry = 'slovakia';

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
        const data = await this.getData();

        if(!data) {
            return;
        }

        Vue.component('border-cams', {
            data () {
                const favoriteCountry = data[_this.favoriteCountry];
                let favoriteItems = [];;

                if (favoriteCountry) {
                    favoriteItems = favoriteCountry.checkpoints
                        .filter(({name}) => !name.includes('вантаж'))
                        .sort(_this.alphabetSort.bind(_this, 'name'));
                }

                return {
                    data,
                    favoriteItems,
                    streamSrc: favoriteItems.length ? favoriteItems[0].src : null
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

        console.log(data);
    }

    alphabetSort(prop, a, b) {
        if(a[prop] < b[prop]) { return 1; }
        if(a[prop] > b[prop]) { return -1; }
        return 0;
    }

    getData() {
        return this.doPageFetch(this.camsUrl)
            .then(this.parseData.bind(this));
    }

    parseData(dom) {
        const countriesEl = dom.querySelectorAll(this.countriesSel);
        const checkpointsEl = dom.querySelectorAll(this.checkpointsSel);

        if(!countriesEl || !checkpointsEl) {
            this.error(`${this.countriesSel} or ${this.checkpointsSel} not found on source page!`);
            return null;
        }

        const countries = Array.prototype.reduce.call(countriesEl, (obj, el) => {
            obj[el.value] = {
                name: el.text,
                checkpoints: []
            }
            return obj;
        }, {});

        // Add checkpoints to the countries
        checkpointsEl.forEach(el => {
            if(countries[el.value]) {
                countries[el.value].checkpoints.push({
                    name: el.text,
                    src: this.updateStreamSrc(el.dataset.link)
                })
            }
        });

        return countries;
    }

    updateStreamSrc(src) {
        const srcObj = new URL(src);

        // Set autoplay
        if(!srcObj.searchParams.get('autoplay')) {
            srcObj.searchParams.set('autoplay', true);
        }

        return srcObj.href;
    }

    error(msg) {
        console.error(msg);
    }
}

// Register Service Worker
const sw = new ServiceWorker();

// Init App
const borderCams = new BorderCams();

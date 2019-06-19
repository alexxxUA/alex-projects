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
                return {
                    data,
                    favoriteItems: favoriteCountry ? favoriteCountry.checkpoints : [],
                    streamSrc: favoriteCountry ? favoriteCountry.checkpoints[0].src : null
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
                    src: el.dataset.link
                })
            }
        });

        return countries;
    }

    error(msg) {
        console.error(msg);
    }
}

const borderCams = new BorderCams();
const lzma = require('lzma-native');
const zlib = require('zlib');
const needle = require('needle');

const Extract = {
    async xz(req, res) {
        const file = await this.downloadFile(req);

        if(file.err) {
            res.status(404).send(file.err);
        } else {
            const extractedFile = await this.extract(file);
            const gzipFile = await this.gzipFile(extractedFile);
            const fileName = this.getFileName(req.query.url).replace('.xz', '.xml.gz');

            res.header({
                'Content-Type': 'text/xml',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            });
            res.status(200).send(gzipFile);
        }
    },
    downloadFile(req) {
        const url = req.query.url;

        if(!url) {
            return {err: 'Specify parameter "url"'};
        }

        //Check if http prefix exist
        if(url.indexOf('http') < 0){
            url = `http://${url}`;
        }

        return needle('GET', url, {}, { follow: 2 })
            .then(response => {
                if (response.statusCode !== 200) {
                    throw Error(response.statusMessage);
                }
                return response;
            })
            .catch(({message}) => {
                return {err: message};
            })
    },
    
    extract(file) {
        return lzma.decompress(file.raw)
            .then(result => {
                return result;
            })
            .catch(err => {
                return err.message;
            })
    },

    gzipFile(file) {
        return new Promise((resolve) =>
            zlib.gzip(file, (err, result) => {
                resolve(result);
            })
        );
    },

    getFileName(url) {
        return url.split('/').pop();
    }
}

module.exports = Extract;

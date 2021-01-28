const needle = require('needle');
const cheerio = require('cheerio');
const cf = require('../config/config.js');
const SchoolPost = require('./schoolPost_schema');

class NotificationWatcher {
    constructor() {
        this.requestOptions = {
            open_timeout: 15000,
            response_timeout: 5000,
            read_timeout: 5000,
            follow_max: 3

        };
        this.retry = {
            counter: 0,
            max: 3,
            timeout: 5000
        };
        this.schoolPostsUrl = 'https://msmoldavska.sk/oznamy/';
        this.schoolPostSelectors = {
            post: '.post',
            day: '.day',
            month: '.month',
            year: '.year',
            titleLink: '.post_info_header a'
        }
        this.schoolPostCheckInterval = 1000 * 60 * 1; // 30min
    }

    init(notification) {
        this.notification = notification;

        this.watch();
    }

    watch() {
        if (cf.watchSchoolPosts) {
            this.watchSchool();
        }
    }

    watchSchool() {
        this.checkSchoolPosts();

        setTimeout(this.watchSchool.bind(this) , this.schoolPostCheckInterval);
    }

    checkSchoolPosts() {      
        return this.getSchoolPosts()
            .then(this.filterPosts.bind(this))
            .then(newPosts => {
                // In case posts successfully received -> reset counter
                this.retry.counter = 0;

                if (newPosts && newPosts.length) {
                    this.saveNewPosts(newPosts);
                    this.notifyAboutNewPosts(newPosts);
                } else {
                    console.log('There are no new posts available.')
                }
            })
            .catch(err => {
                // Retry operation in case of fail
                if (this.retry.counter < this.retry.max) {
                    this.retry.counter += 1;
                    setTimeout(this.checkSchoolPosts.bind(this), this.retry.timeout);
                } else {
                    this.retry.counter = 0;
                }

                return console.error(err);
            })
    }

    saveNewPosts(posts) {
        return posts.forEach(post => {
            new SchoolPost(post).save();
        });
    }

    notifyAboutNewPosts(posts) {
        return posts.forEach(({ title, url }) => {
            this.notification.sendSchoolNotification({
                text: title,
                url
            });
        });
    }

    filterPosts(posts) {
        const ids = posts.reduce((idArray, post) => {
            idArray.push(post.id);
            return idArray;
        }, []);

        return SchoolPost.find({ id: ids }, null, { lean: true })
            .then(existingPosts => {
                const newPosts = posts.filter((post) => {
                    return !existingPosts.some(({ id }) => id === post.id);
                });

                return newPosts;
            });
    }

    parsePosts($) {
        const sel = this.schoolPostSelectors;
        const posts = $(sel.post);
        const postsData = Array.prototype.map.call(posts, post => {
            const $link = $(sel.titleLink, post);

            return {
                id: post.attribs.id,
                title: $link.text(),
                url: $link.attr('href'),
                day: $(sel.day, post).text(),
                month: $(sel.month, post).text(),
                year: $(sel.year, post).text()
            }
        });

        if (!posts || !posts.length) {
            throw 'Posts not found!';
        }

        return postsData;
    }

    getSchoolPosts() {
        return this.requestPageDom(this.schoolPostsUrl)
            .then(this.parsePosts.bind(this));
    }

    getDom(htmlString) {
        return cheerio.load(htmlString, {decodeEntities: true}, { features: { QuerySelector: true }});
    }

    requestPageDom(url) {
        return this.requestPage(url)
            .then(this.getDom);
    }

    requestPage(url) {
        return needle('get', url, this.requestOptions)
            .then(function(resp) {
                if (!resp.body) {
                    throw 'Empty response!';
                }

                return resp.body;
            });
        }
    }

module.exports = new NotificationWatcher();
const webpush = require('web-push');
const Device = require('./device_schema.js');

class Notification {
	init ({ publicKey, privateKey }) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;

        webpush.setVapidDetails("mailto:example@yourdomain.org", this.publicKey, this.privateKey);
    }

    /**
     * 
     * @param {Object} notification 
     * Example of notification parameter:
     * {
            title: "New Product Available ",
            text: "HEY! Take a look at this brand new t-shirt!",
            image: "/images/jason-leung-HM6TMmevbZQ-unsplash.jpg",
            tag: "new-product",
            url: "/new-product-jason-leung-HM6TMmevbZQ-unsplash.html"
        }
     */
    sendPushNotification (subscriptions, notification) {
        subscriptions.forEach(subscription => {
            webpush
                .sendNotification(subscription, JSON.stringify(notification))
                .catch(err => {
                    console.error(err);
                });
        });
    }

    sendToFilteredDevices (key, notification) {
        Device.find({[ key ]: 'on'}, 'subscription', (err, devices) => {
            if (err) return console.error(err);

            if (devices && devices.length) {
                const subscriptions = devices.map(device => device.subscription);
                this.sendPushNotification(subscriptions, notification);
            } else {
                console.warn('Subscriptions was not found!');
            }
        })
    }

    sendSchoolNotification (notification) {
        this.sendToFilteredDevices('school', {
            title: 'MS Moldavska: novy oznam',
            image: 'http://msmoldavska.sk/wp-content/uploads/2016/04/logo-msmoldavska3.png',
            text: 'Nové oznámenie',
            tag: 'Nové oznámenie',
            url: 'https://msmoldavska.sk/oznamy/',
            ...notification
        });
    }

    sendAdminNotification (notification) {
        this.sendToFilteredDevices('admin', {
            title: 'Admin notification',
            image: '/img/icon-192x192.png',
            text: 'Nové oznámenie',
            tag: 'admin',
            url: '/',
            ...notification
        });
    }
}

module.exports = new Notification();

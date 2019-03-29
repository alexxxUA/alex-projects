const GEO = {
    key: 'AIzaSyCkGUiH-i3oF8Y0ropKElJklhaE8miaJdc',
    linkSel: '#getLocation',
	postalCodeKey: 'postal_code',
	defaultErrorMsg: 'Failed to get location',
	init: function(){
		this.events();
    },
    events: function(){
        const link = document.querySelector(this.linkSel);

        link.addEventListener('click', this.getGeolocation.bind(this));
    },
    getGeolocation: function(e){
        e.preventDefault();
        const that = this;

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(that.showPosition.bind(that), function(err){
				that.locationError('Access to geolocation has been denied.')
			});
		} else { 
			that.locationError('Geolocation is not supported by this device/browser.');
		}
    },
	locationError: function(msg) {
		alert(msg);	
	},
	showPosition: function (position) {
		const that = this;
		const latitude = position.coords.latitude;
		const longitude = position.coords.longitude;

		$.ajax(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.key}`)
			.then(that.getPostalCode,
				function fail (status) {
					that.locationError(that.defaultErrorMsg);
				}
			);
	},
	getPostalCode: function (resp) {
		var firstAddress = resp.results && resp.results[0].address_components || [],
			postalCodeKey = 'postal_code';

		var postalCodeData = firstAddress.find(function(item) {
			return item.types[0] === postalCodeKey;
		});

		if (!postalCodeData) {
			this.locationError(this.defaultErrorMsg);
		} else {
			alert(`Your postal code: ${postalCodeData.long_name}`);
		}
	}
};

GEO.init();
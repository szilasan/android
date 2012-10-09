/*
 * Geolocation
 * Implements the javascript access to the cordova plugin for retrieving the device mac address. Returns 0 if not running on Android
 * @author Alina Bidnenko
 */

/*
 * @return the Geolocation class instance
 */

var Geolocation = function() {
};

/*
 * Returns the coordinates every 10 minutes. 
 * 
 * @param successCallback
 *            The callback which will be called when directory listing is
 *            successful
 * @param failureCallback
 *            The callback which will be called when directory listing encouters
 *            an error
 */
 
Geolocation.prototype.startGettingLocation = function(token, successCallback, failureCallback) {
	return cordova.exec(successCallback, failureCallback, 'GeolocationPlugin',
			'startGettingLocation', [ token ]);
};

Geolocation.prototype.stopGettingLocation = function(successCallback, failureCallback) {
	return cordova.exec(successCallback, failureCallback, 'GeolocationPlugin',
			'stopGettingLocation', []);
};

if(!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.geolocation) {
    window.plugins.geolocation = new Geolocation();
}

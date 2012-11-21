package com.phonegap.plugins.geolocation.android;

import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.os.IBinder;
import android.text.TextUtils;
import android.util.Log;

import com.mobilezapp.instatrace.R;
import com.novoda.location.Locator;
import com.novoda.location.LocatorFactory;
import com.novoda.location.LocatorSettings;
import com.novoda.location.exception.NoProviderAvailable;

import java.util.Timer;
import java.util.TimerTask;

public class GeolocationService extends Service {

    public static final String TOKEN_EXTERNAL = "com.phonegap.plugins.geolocation.android.TOKEN_EXTERNAL";
    private static final String TAG = GeolocationService.class.getName();

    private static long TIME_LOCATION_UPDATES = 10 * 5 * 1000;
    private static long TIME_LOCATION_SEND = 10 * 60 * 1000;

    private static String mPackageName;
    private Timer timer;
    private Locator mLocator;
    private GeolocationApiHelper mApiHelper;

    @Override
    public void onStart(Intent intent, int startId) {
        final String token = Prefs.getStringProperty(this, R.string.key_token);
        if (!TextUtils.isEmpty(token)) {
            mLocator = LocatorFactory.getInstance();

            final LocatorSettings settings = new LocatorSettings(mPackageName, "");
            settings.setUpdatesInterval(TIME_LOCATION_UPDATES);
            mLocator.prepare(this, settings);
            try {
                mLocator.startLocationUpdates();
            } catch (NoProviderAvailable e) {
                Log.e(TAG, e.getMessage());
            }
            mApiHelper = new GeolocationApiHelper(this, null);
            //startTimer(token);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public void stop() {
        mLocator.stopLocationUpdates();
        timer.cancel();
    }

    private void startTimer(final String token) {
        timer = new Timer();
        timer.scheduleAtFixedRate(new TimerTask() {

            @Override
            public void run() {
                final Location location = mLocator.getLocation();
                if (isPrecise(location)) {
                    sendLocation(token, location);
                }
            }
        }, 0, TIME_LOCATION_SEND);

    }

    private void sendLocation(String token, Location location) {
        final double longitude = location.getLongitude();
        final double latitude = location.getLatitude();
        mApiHelper.sendLocation(token, longitude, latitude);
    }

    private boolean isPrecise(Location location) {
        boolean result = true;
        if (location == null || (location.hasAccuracy() && location.getAccuracy() > 200)) {
            result = false;
        }
        return result;
    }
}

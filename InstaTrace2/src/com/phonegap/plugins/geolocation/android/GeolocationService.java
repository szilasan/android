package com.phonegap.plugins.geolocation.android;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.provider.Settings;

import android.os.Bundle;
import android.os.IBinder;
import android.text.TextUtils;
import android.util.Log;

import com.mobilezapp.instatrace.R;
//import com.novoda.location.Locator;

import java.lang.reflect.Method;
import java.util.Timer;
import java.util.TimerTask;

public class GeolocationService extends Service {

    public static final String TOKEN_EXTERNAL = "com.phonegap.plugins.geolocation.android.TOKEN_EXTERNAL";
    private static final String TAG = GeolocationService.class.getName();

    private static long TIME_LOCATION_UPDATES = 5 * 60 * 1000;
    private static long TIME_LOCATION_SEND = 3 * 60 * 1000;
    protected static final int ONE_MINUTE = 1000 * 60 * 1;
    protected static final int TWO_MINUTES = 1000 * 60 * 2;
    public static final String PACKAGE_NAME = "com.phonegap.plugins.geolocation.android";
    public static final String LOCATION_UPDATE_ACTION = "com.phonegap.plugins.geolocation.android.action.ACTION_FRESH_LOCATION";


    //private static String mPackageName;
    private Timer timer;
    //private Locator mLocator;
    private GeolocationApiHelper mApiHelper;
    
    
    // Acquire a reference to the system Location Manager
    LocationManager mLocationManager ;
    
    // Define a listener that responds to location updates
    LocationListener mLocationListener;
    private Location currentBestLocation = null;
    private String token = "";
 	    
    @Override
    public void onDestroy() {
    	super.onDestroy();
    }
    
      
    @Override
    public void onCreate() {
        
    }


    @Override
    public void onStart(Intent intent, int startId) {
    	super.onStart(intent, startId);
    	 

    	token = Prefs.getStringProperty(this, R.string.key_token);
    	//final String token = Prefs.getStringProperty(this, R.string.key_token);
        if (!TextUtils.isEmpty(token)) {
        	
//            LocatorSettings settings = new LocatorSettings(PACKAGE_NAME, LOCATION_UPDATE_ACTION);
//            settings.setUpdatesInterval(TIME_LOCATION_UPDATES);
//            settings.setUpdatesDistance(2);
//            mLocator = LocatorFactory.getInstance();            
//            mLocator.prepare(this, settings);
//            try {
//                mLocator.startLocationUpdates();
//            } catch (NoProviderAvailable e) {
//                Log.e(TAG, e.getMessage());
//            }
        	
        	try {
                if(!getGPSStatus()){
               	 setGPSStatus(true);
                }                 
            }
            catch(Exception e) {
            }
        	mLocationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        	mLocationListener = new LocationListener() {
        	    public void onLocationChanged(Location location) {
        	      // Called when a new location is found by the network location provider.        	     
        	    	if (isBetterLocation(location, currentBestLocation)) {
                        currentBestLocation = location;
                        sendLocation(token, currentBestLocation);
                    }

        	    }

        	    public void onStatusChanged(String provider, int status, Bundle extras) {}

        	    public void onProviderEnabled(String provider) {}

        	    public void onProviderDisabled(String provider) {}


        	 };
            // We query every available location providers
            mLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, TIME_LOCATION_UPDATES, 0, mLocationListener);
            mLocationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, TIME_LOCATION_UPDATES, 0, mLocationListener);

            Location location = mLocationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (location == null)
            {
                location = mLocationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (location != null) {
                    if (isBetterLocation(location, currentBestLocation)) {
                        currentBestLocation = location;
                        sendLocation(token, currentBestLocation);                        
                    }
                }
            }
       	
        	
            mApiHelper = new GeolocationApiHelper(this, null);
           // startTimer(token);
            Log.e(TAG, "=======Instatrace Service Starting =======");
        }
    }
     
  
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public void stop() {
        //mLocator.stopLocationUpdates();
        timer.cancel();
    }

//    private void startTimer(final String token) {
//        timer = new Timer();
//        timer.scheduleAtFixedRate(new TimerTask() {
//
//            @Override
//            public void run() {            	
//                /*Location location = mLocator.getLocation();      
//		        if (isPrecise(location)) {                	
//		            sendLocation(token, location);
//		        }*/
//            	Location location = mLocationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
//                if (location == null)
//                {
//                    location = mLocationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
//                    if (location != null) {
//                        if (isBetterLocation(location, currentBestLocation)) {
//                            currentBestLocation = location;
//                            sendLocation(token, currentBestLocation);                        
//                        }
//                    }
//                }
//            	
//                Log.e(TAG, "=======Instatrace location sending =======");
//            }
//        }, 0, TIME_LOCATION_SEND);
//
//    }

    private void sendLocation(String token, Location location) {
        double longitude = location.getLongitude();
        double latitude = location.getLatitude();
        mApiHelper.sendLocation(token, longitude, latitude);
    }

    
    
    private boolean getGPSStatus()
    {
        String allowedLocationProviders =
            Settings.System.getString(getContentResolver(),
            Settings.System.LOCATION_PROVIDERS_ALLOWED);
        if (allowedLocationProviders == null) {
            allowedLocationProviders = "";
        }
        return allowedLocationProviders.contains(LocationManager.GPS_PROVIDER);
    }

    private void setGPSStatus(boolean pNewGPSStatus)
    {
        String allowedLocationProviders =
            Settings.System.getString(getContentResolver(),
            Settings.System.LOCATION_PROVIDERS_ALLOWED);
        if (allowedLocationProviders == null) {
            allowedLocationProviders = "";
        }
        boolean networkProviderStatus =
            allowedLocationProviders.contains(LocationManager.NETWORK_PROVIDER);
        allowedLocationProviders = "";
        if (networkProviderStatus == true) {
            allowedLocationProviders += LocationManager.NETWORK_PROVIDER;
        }
        if (pNewGPSStatus == true) {
            allowedLocationProviders += "," + LocationManager.GPS_PROVIDER;
        }
        Settings.System.putString(getContentResolver(),
            Settings.System.LOCATION_PROVIDERS_ALLOWED, allowedLocationProviders);
        try {
            Method m =
                mLocationManager.getClass().getMethod("updateProviders", new Class[] {});
            m.setAccessible(true);
            m.invoke(mLocationManager, new Object[]{});
        }
        catch(Exception e) {
        }
        return;
    }
    
    /** Determines whether one Location reading is better than the current Location fix
     * @param location  The new Location that you want to evaluate
     * @param currentBestLocation  The current Location fix, to which you want to compare the new one
     */
   protected boolean isBetterLocation(Location location, Location currentBestLocation) {
       if (currentBestLocation == null) {
           // A new location is always better than no location
           return true;
       }

       // Check whether the new location fix is newer or older
       long timeDelta = location.getTime() - currentBestLocation.getTime();
       boolean isSignificantlyNewer = timeDelta > TWO_MINUTES;
       boolean isSignificantlyOlder = timeDelta < -TWO_MINUTES;
       boolean isNewer = timeDelta > 0;

       // If it's been more than two minutes since the current location, use the new location
       // because the user has likely moved
       if (isSignificantlyNewer) {
           return true;
       // If the new location is more than two minutes older, it must be worse
       } else if (isSignificantlyOlder) {
           return false;
       }

       // Check whether the new location fix is more or less accurate
       int accuracyDelta = (int) (location.getAccuracy() - currentBestLocation.getAccuracy());
       boolean isLessAccurate = accuracyDelta > 0;
       boolean isMoreAccurate = accuracyDelta < 0;
       boolean isSignificantlyLessAccurate = accuracyDelta > 200;

       // Check if the old and new location are from the same provider
       boolean isFromSameProvider = isSameProvider(location.getProvider(), currentBestLocation.getProvider());

       // Determine location quality using a combination of timeliness and accuracy
       if (isMoreAccurate) {
           return true;
       } else if (isNewer && !isLessAccurate) {
           return true;
       } else if (isNewer && !isSignificantlyLessAccurate && isFromSameProvider) {
           return true;
       }
       return false;
   }

   /** Checks whether two providers are the same */
   private boolean isSameProvider(String provider1, String provider2) {
       if (provider1 == null) {
         return provider2 == null;
       }
       return provider1.equals(provider2);
   }
   
   /*private boolean isPrecise(Location location) {
	   boolean result = true;
	   
	   if (location == null || (location.hasAccuracy() && location.getAccuracy() > 200)) {
	       result = false;
	   }
	   return result;
	}*/
    
   
}

package com.phonegap.plugins.geolocation.android;

import android.content.Intent;
import android.text.TextUtils;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.apache.cordova.api.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;

import com.mobilezapp.instatrace.R;


public class GeolocationPlugin extends Plugin {

    private static final String START_SERVICE_ACTION = "startGettingLocation";
    private static final String STOP_SERVICE_ACTION = "stopGettingLocation";

    @Override
    public PluginResult execute(String action, JSONArray data, String callbackId) {
        PluginResult result = new PluginResult(Status.OK);
        if (action.equals(START_SERVICE_ACTION)) {
            try {
                String token = data.getString(0);
                if (!TextUtils.isEmpty(token)) {
                    Prefs.setStringProperty(ctx.getContext(), R.string.key_token, token);
                    final Intent intent = new Intent(ctx.getContext(), GeolocationService.class);
                    ctx.getContext().startService(intent);
                }
            } catch (JSONException e) {
                e.printStackTrace();
                result = new PluginResult(Status.JSON_EXCEPTION, e.getMessage());
            }
        }
        if (action.equals(STOP_SERVICE_ACTION)) {
            stopGettingLocation();
        }
        return result;
    }

    public void stopGettingLocation() {
        final Intent service = new Intent(ctx.getContext(), GeolocationService.class);
        ctx.getContext().stopService(service);
    }
}

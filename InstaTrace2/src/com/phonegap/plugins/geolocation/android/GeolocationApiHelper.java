package com.phonegap.plugins.geolocation.android;

import android.content.Context;

import com.the111min.android.api.BaseApiHelper;
import com.the111min.android.api.Request;
import com.the111min.android.api.Request.Builder;
import com.the111min.android.api.Request.RequestMethod;
import com.the111min.android.api.ResponseReceiver;

public class GeolocationApiHelper extends BaseApiHelper {

    public GeolocationApiHelper(Context context, ResponseReceiver receiver) {
        super(context, receiver);
    }

    public void sendLocation(String token, double longitude, double latitude) {
        final String endpoint = "http://api.instatrace.com/api/driver/locations";
        final StringBuilder params = new StringBuilder();
        final Request.Builder builder = new Builder(endpoint + params.toString(), RequestMethod.POST);
        builder.addBodyParam("location[longitude]", String.valueOf(longitude));
        builder.addBodyParam("location[latitude]", String.valueOf(latitude));
        builder.addBodyParam("token", token);
        builder.setResponseHandler(SimpleResponseHandler.class);
        sendRequest(builder.create());
    }
}

package com.phonegap.plugins.geolocation.android;

import android.content.Context;

import com.the111min.android.api.Request;
import com.the111min.android.api.Response;
import com.the111min.android.api.ResponseHandler;

import org.apache.cordova.api.LOG;
import org.apache.http.HttpResponse;

public class SimpleResponseHandler extends ResponseHandler {

    private static String TAG = SimpleResponseHandler.class.getSimpleName();

    @Override
    public Response handleResponse(Context context, HttpResponse response, Request request)
            throws Exception {
        int code = response.getStatusLine().getStatusCode();
        LOG.d(TAG, "Status Code: " + String.valueOf(code));
        return new Response(true);
    }

}

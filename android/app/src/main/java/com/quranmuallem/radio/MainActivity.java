package com.quranmuallem.radio;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigenes Plugin für die native Hintergrund-Wiedergabe registrieren (vor super.onCreate)
        registerPlugin(NativeRadioPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

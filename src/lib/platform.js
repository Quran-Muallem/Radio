import { Capacitor, registerPlugin } from '@capacitor/core';

// true in der Android-App (Capacitor), false im Browser / als PWA
export const isNative = Capacitor.isNativePlatform();

// Eigenes natives Plugin (android/.../NativeRadioPlugin.java):
// Hintergrund-Wiedergabe über einen Media-Dienst mit Sperrbildschirm-Steuerung.
export const NativeRadio = registerPlugin('NativeRadio');

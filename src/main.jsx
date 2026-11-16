import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { isNative } from './lib/platform.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: Service Worker nur im Browser über HTTPS (nicht in der Android-App, nicht bei file://)
if (!isNative && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* z. B. als Einzeldatei ohne sw.js gehostet – App funktioniert trotzdem */
    });
  });
}

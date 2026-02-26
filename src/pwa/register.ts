import { registerSW } from 'virtual:pwa-register';

export const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update: activate new service worker immediately
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

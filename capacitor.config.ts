import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cryptoapp.monitor',
  appName: 'CryptoMonitor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

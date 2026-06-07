import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicaduca.app',
  appName: 'MediCaduca',
  webDir: 'out',
  server: {
    url: 'https://medicaduca.vercel.app',
    cleartext: false
  }
};

export default config;

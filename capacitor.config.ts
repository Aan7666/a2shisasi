import type { CapacitorConfig } from '@capacitor/cli';


const config: CapacitorConfig = {
  appId: 'com.a2shi.academy.myapp',
  appName: 'a2shi academy',
  webDir: 'www',
  plugins: {
    Browser: {
      presentationStyle: 'popover'
    }
  }
};

export default config;
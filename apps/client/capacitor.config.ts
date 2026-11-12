import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Wraps the web app (the `dist` folder) in Android and iOS apps.
 * The app ID is a placeholder. It can be changed freely until the first upload to a
 * store, and never after, so confirm it before that upload.
 */
const config: CapacitorConfig = {
  appId: 'com.kiyuv.learning',
  appName: 'Kiyuv Learning',
  webDir: 'dist',
  backgroundColor: '#ff86c8',
  ios: { contentInset: 'always', limitsNavigationsToAppBoundDomains: false },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#ff86c8', showSpinner: false },
    StatusBar: { style: 'DARK', backgroundColor: '#4f8bff' },
    FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com', 'apple.com'] },
  },
};

export default config;

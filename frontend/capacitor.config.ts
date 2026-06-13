import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wrapper for the LERA web app.
 *
 * Strategy: ship the web app as a "thin" native shell that loads the live
 * Next.js deployment. Single source of truth (web, iOS, Android share the
 * same app) and feature releases don't require new App Store submissions.
 *
 * Environment variables:
 *   LERA_MOBILE_URL        — what the WebView loads. Default: http://localhost:3000
 *                            for dev. Set to https://app.example.com in CI.
 *   LERA_MOBILE_INSECURE   — set to "true" to allow cleartext HTTP traffic.
 *                            Defaults to "true" only when LERA_MOBILE_URL is
 *                            an http:// URL (i.e. dev). Production HTTPS
 *                            builds are strict by default.
 */
const url = process.env.LERA_MOBILE_URL || 'http://localhost:3000';
const isHttp = url.startsWith('http://');
const allowInsecure =
  (process.env.LERA_MOBILE_INSECURE ?? (isHttp ? 'true' : 'false')) === 'true';

const config: CapacitorConfig = {
  appId: 'com.lera.app',
  appName: 'LERA',
  webDir: 'out',
  server: {
    url,
    androidScheme: 'https',
    cleartext: allowInsecure,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: allowInsecure,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

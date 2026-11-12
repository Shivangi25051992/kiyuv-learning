import { isNativeApp } from '../../lib/native.js';

export const SITE_URL = 'https://kiyuv-learning.web.app';
export const PRIVACY_URL = `${SITE_URL}/privacy.html`;
export const TERMS_URL = `${SITE_URL}/terms.html`;

/** Opens a page outside the app: the phone's browser in the apps, a new tab on the web. */
export async function openExternal(url: string): Promise<void> {
  if (isNativeApp()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

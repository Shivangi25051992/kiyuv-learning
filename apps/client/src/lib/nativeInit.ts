import { isNativeApp } from './native.js';

/** Sets up the phone app: status bar colour, then hides the splash screen. Does nothing on the web. */
export async function initNativeApp(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // The status bar plugin is optional: the app works without it.
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // Same: the splash screen hides itself after a short time anyway.
  }
}

/**
 * Saves text as a file the parent can keep or send. A browser download does not work inside
 * the phone apps, so the file is written to the app's cache and the share sheet opens.
 */
export async function shareTextFile(fileName: string, text: string): Promise<void> {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const written = await Filesystem.writeFile({
    path: fileName,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({ title: 'My Kiyuv data', files: [written.uri], dialogTitle: 'Save or send my data' });
}

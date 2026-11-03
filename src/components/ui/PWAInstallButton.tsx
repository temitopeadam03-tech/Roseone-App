import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> };

export const PWAInstallButton: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (isInstalled) return null;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const install = async () => {
    if (!installPrompt) {
      if (isIos) setShowIosHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  return <>
    <button type="button" onClick={install} title="Install Gistupp on your phone" aria-label="Install Gistupp app" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50 px-2.5 text-xs font-bold text-pink-700 transition hover:bg-pink-100 dark:border-pink-900 dark:bg-pink-950/30 dark:text-pink-200 dark:hover:bg-pink-950/60">
      {isIos ? <Smartphone className="h-4 w-4"/> : <Download className="h-4 w-4"/>}
      <span className="hidden sm:inline">Install app</span>
    </button>
    {showIosHelp && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="gistupp-install-help">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#1a151f]">
        <h2 id="gistupp-install-help" className="text-base font-extrabold text-slate-900 dark:text-white">Install Gistupp</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">On your iPhone or iPad, tap the Share button in Safari, then choose <strong>Add to Home Screen</strong>.</p>
        <button type="button" onClick={() => setShowIosHelp(false)} className="mt-4 w-full rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-bold text-white">Got it</button>
      </div>
    </div>}
  </>;
};

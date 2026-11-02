import { useEffect } from 'react';
import { AdBanner } from './AdBanner';

const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined;
const SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

let scriptLoadStarted = false;

function loadAdSenseScript(clientId: string) {
  if (scriptLoadStarted) return;
  scriptLoadStarted = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

interface AdSenseUnitProps {
  onUpgradeClick: () => void;
}

// Real AdSense ad, shown once VITE_ADSENSE_CLIENT_ID and
// VITE_ADSENSE_SLOT_ID are configured (see README). Until then, falls back
// to the local AdBanner placeholder so the free-tier UX still demos
// correctly without a real AdSense account.
export function AdSenseUnit({ onUpgradeClick }: AdSenseUnitProps) {
  useEffect(() => {
    if (!CLIENT_ID || !SLOT_ID) return;
    loadAdSenseScript(CLIENT_ID);
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch {
      // Script not loaded yet, or blocked by an ad blocker - fail silently.
    }
  }, []);

  if (!CLIENT_ID || !SLOT_ID) {
    return <AdBanner onUpgradeClick={onUpgradeClick} />;
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={CLIENT_ID}
      data-ad-slot={SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

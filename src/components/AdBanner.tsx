import { useLanguage } from '../i18n/LanguageContext';

interface AdBannerProps {
  onUpgradeClick: () => void;
}

export function AdBanner({ onUpgradeClick }: AdBannerProps) {
  const { t } = useLanguage();
  return (
    <div className="ad-banner">
      <div className="ad-banner-text">
        <span className="ad-banner-label">{t('adLabel')}</span>
        <span>{t('adBannerText')}</span>
      </div>
      <button className="ad-banner-upgrade" onClick={onUpgradeClick}>
        {t('removeAds')}
      </button>
    </div>
  );
}

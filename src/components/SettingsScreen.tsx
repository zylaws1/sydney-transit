import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';

interface SettingsScreenProps {
  onManagePremium: () => void;
  onOpenPrivacy: () => void;
}

export function SettingsScreen({ onManagePremium, onOpenPrivacy }: SettingsScreenProps) {
  const { isPremium, billingCycle, unsubscribe } = useSubscription();
  const { favoriteIds, clearFavorites } = useFavorites();
  const { logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const resetDemoData = () => {
    if (!confirm(t('resetConfirm'))) return;
    clearFavorites();
    unsubscribe();
    logout();
  };

  const plan = isPremium
    ? t('premiumLabel', { cycle: t(billingCycle === 'annual' ? 'annualLabel' : 'monthlyLabel') })
    : t('freeLabel');

  return (
    <div className="settings-screen">
      <section className="settings-section">
        <h3>{t('settingsLanguageHeading')}</h3>
        <div className="language-options">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => setLanguage(lang.code)}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>{t('settingsSubscriptionHeading')}</h3>
        <div className="settings-row">
          <span>{plan}</span>
          <button className="settings-link" onClick={onManagePremium}>
            {t('manageButton')}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>{t('settingsDataHeading')}</h3>
        <div className="settings-row">
          <span>{t('favoriteStopsCount', { n: favoriteIds.length })}</span>
          <button className="settings-link" onClick={clearFavorites} disabled={favoriteIds.length === 0}>
            {t('clearButton')}
          </button>
        </div>
        <button className="settings-reset" onClick={resetDemoData}>
          {t('resetAllData')}
        </button>
      </section>

      <section className="settings-section">
        <h3>{t('settingsAboutHeading')}</h3>
        <p className="settings-about">{t('settingsAboutText')}</p>
        <button className="settings-link" onClick={onOpenPrivacy}>
          {t('settingsPrivacyLink')}
        </button>
      </section>
    </div>
  );
}

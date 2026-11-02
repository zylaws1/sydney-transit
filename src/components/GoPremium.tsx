import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../i18n/LanguageContext';
import { SignInForm } from './SignInForm';

export function GoPremium() {
  const { isLoggedIn, login } = useAuth();
  const { isPremium, billingCycle, subscribe, unsubscribe } = useSubscription();
  const { t } = useLanguage();

  if (isPremium) {
    return (
      <div className="premium-status">
        <h2>{t('premiumActiveTitle')}</h2>
        <p>{t('premiumActiveDetail', { plan: t(billingCycle === 'annual' ? 'planAnnual' : 'planMonthly') })}</p>
        <button className="premium-cancel" onClick={unsubscribe}>
          {t('cancelDemo')}
        </button>
        <p className="go-premium-note">{t('demoNoteCancel')}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="go-premium">
        <h2>{t('goPremiumTitle')}</h2>
        <p className="go-premium-pitch">{t('goPremiumSignInPitch')}</p>
        <SignInForm onSignIn={login} />
      </div>
    );
  }

  return (
    <div className="go-premium">
      <h2>{t('goPremiumTitle')}</h2>
      <p className="go-premium-pitch">{t('goPremiumPitch')}</p>
      <div className="plan-cards">
        <button className="plan-card" onClick={() => subscribe('monthly')}>
          <span className="plan-label">{t('monthlyLabel')}</span>
          <span className="plan-price">
            $2.99<small>/mo</small>
          </span>
        </button>
        <button className="plan-card featured" onClick={() => subscribe('annual')}>
          <span className="plan-badge">{t('saveBadge')}</span>
          <span className="plan-label">{t('annualLabel')}</span>
          <span className="plan-price">
            $19.99<small>/yr</small>
          </span>
        </button>
      </div>
      <p className="go-premium-note">{t('demoNoteSubscribe')}</p>
    </div>
  );
}

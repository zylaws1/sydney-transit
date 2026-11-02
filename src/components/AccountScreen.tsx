import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../i18n/LanguageContext';
import { SignInForm } from './SignInForm';

export function AccountScreen() {
  const { email, isLoggedIn, login, logout } = useAuth();
  const { isPremium, billingCycle } = useSubscription();
  const { t } = useLanguage();

  if (!isLoggedIn) {
    return (
      <div className="account-screen">
        <h2>{t('signInTitle')}</h2>
        <p className="go-premium-pitch">{t('signInPitch')}</p>
        <SignInForm onSignIn={login} note={t('signInDemoNote')} />
      </div>
    );
  }

  const plan = isPremium
    ? t('premiumLabel', { cycle: t(billingCycle === 'annual' ? 'annualLabel' : 'monthlyLabel') })
    : t('freeLabel');

  return (
    <div className="account-screen">
      <h2>{t('signedInTitle')}</h2>
      <p className="account-email">{email}</p>
      <p className="account-detail">{t('planLabel', { plan })}</p>
      <button className="premium-cancel" onClick={logout}>
        {t('signOut')}
      </button>
    </div>
  );
}

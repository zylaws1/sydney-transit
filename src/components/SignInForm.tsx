import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface SignInFormProps {
  onSignIn: (email: string) => void;
  note?: string;
}

export function SignInForm({ onSignIn, note }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const { t } = useLanguage();

  return (
    <form
      className="sign-in-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) onSignIn(email.trim());
      }}
    >
      <label className="sign-in-label" htmlFor="sign-in-email">
        {t('emailLabel')}
      </label>
      <input
        id="sign-in-email"
        className="search-input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" className="sign-in-submit">
        {t('continueButton')}
      </button>
      {note && <p className="go-premium-note">{note}</p>}
    </form>
  );
}

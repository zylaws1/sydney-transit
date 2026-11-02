import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'premium-subscription';

export type BillingCycle = 'monthly' | 'annual';

interface SubscriptionState {
  isPremium: boolean;
  billingCycle: BillingCycle | null;
}

const DEFAULT_STATE: SubscriptionState = { isPremium: false, billingCycle: null };

function readSubscription(): SubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SubscriptionState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

// Demo-only: subscription status lives in localStorage until real billing
// (Stripe) and an account system (Supabase) are wired up. subscribe()/
// unsubscribe() just flip the local flag instead of charging a card.
export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(readSubscription);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const subscribe = useCallback((billingCycle: BillingCycle) => {
    setState({ isPremium: true, billingCycle });
  }, []);

  const unsubscribe = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return { ...state, subscribe, unsubscribe };
}

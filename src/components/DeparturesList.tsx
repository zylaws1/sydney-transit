import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../i18n/LanguageContext';
import type { Departure, Stop } from '../types';
import { formatClockTime } from '../utils';
import { AdSenseUnit } from './AdSenseUnit';
import { ModeIcon } from './ModeIcon';
import { StatusBadge } from './StatusBadge';

interface DeparturesListProps {
  stop: Stop;
  onBack: () => void;
  onUpgradeClick: () => void;
}

export function DeparturesList({ stop, onBack, onUpgradeClick }: DeparturesListProps) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPremium } = useSubscription();
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    transitClient.departures(stop.id).then((result) => {
      if (!cancelled) {
        setDepartures(result);
        setLoading(false);
      }
    });
    const interval = setInterval(() => {
      transitClient.departures(stop.id).then((result) => {
        if (!cancelled) setDepartures(result);
      });
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stop.id]);

  return (
    <div className="departures-view">
      <button className="back-button" onClick={onBack}>
        {t('backButton')}
      </button>
      <h2>{stop.name}</h2>
      {loading ? (
        <p className="empty-message">{t('loadingDepartures')}</p>
      ) : departures.length === 0 ? (
        <p className="empty-message">{t('noUpcomingDepartures')}</p>
      ) : (
        <ul className="departures-list">
          {departures.map((dep) => {
            const estimated = dep.estimatedTime ?? dep.scheduledTime;
            return (
              <li key={dep.id} className={`departure-row ${dep.cancelled ? 'cancelled' : ''}`}>
                <ModeIcon mode={dep.mode} />
                <div className="departure-main">
                  <span className="departure-line">{dep.line}</span>
                  <span className="departure-destination">→ {dep.destination}</span>
                  <StatusBadge scheduled={dep.scheduledTime} estimated={estimated} cancelled={dep.cancelled} />
                </div>
                {dep.platform && (
                  <span className="departure-platform">{t('platformShort', { platform: dep.platform })}</span>
                )}
                <div className="departure-time">
                  <span className="departure-clock">{formatClockTime(estimated)}</span>
                  <span className="departure-countdown">
                    {dep.cancelled ? '—' : t('minutesSuffix', { n: dep.minutesUntil })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!isPremium && <AdSenseUnit onUpgradeClick={onUpgradeClick} />}
    </div>
  );
}

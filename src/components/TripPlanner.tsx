import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop, TripOption } from '../types';
import { formatClockTime } from '../utils';
import { ModeIcon } from './ModeIcon';
import { StatusBadge } from './StatusBadge';
import { StopField } from './StopField';
import { StopSelectorSheet } from './StopSelectorSheet';

type TimeMode = 'now' | 'depart' | 'arrive';

function transferMinutes(arriveEstimated: string, nextDepartEstimated: string): number {
  return Math.round((new Date(nextDepartEstimated).getTime() - new Date(arriveEstimated).getTime()) / 60_000);
}

// Short form for the inline "Transfer at X" line - just the station name,
// not the ", Suburb" suffix that's already implied by context.
function shortStopName(name: string): string {
  return name.split(',')[0];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function todayDateInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeInput(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TripPlanner() {
  const [from, setFrom] = useState<Stop | null>(null);
  const [to, setTo] = useState<Stop | null>(null);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [options, setOptions] = useState<TripOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<TimeMode>('now');
  const [whenDate, setWhenDate] = useState(todayDateInput);
  const [whenTime, setWhenTime] = useState(nowTimeInput);
  const [loadingMore, setLoadingMore] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!from || !to || from.id === to.id) {
      setOptions(null);
      return;
    }
    setLoading(true);
    const when = timeMode === 'now' ? undefined : new Date(`${whenDate}T${whenTime}`);
    transitClient
      .planTrip(from.id, to.id, when ? { when, arriveBy: timeMode === 'arrive' } : undefined)
      .then((result) => {
        setOptions(result);
        setExpandedId(result[0]?.id ?? null);
        setLoading(false);
      });
  }, [from, to, timeMode, whenDate, whenTime]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  // A single search only returns a handful of representative alternatives
  // (confirmed against the real API - it's not an exhaustive timetable), so
  // "later trips" means asking again starting just after the last one shown.
  const loadMoreTrips = async () => {
    if (!from || !to || !options || options.length === 0) return;
    setLoadingMore(true);
    const lastDepart = options.reduce(
      (latest, o) => Math.max(latest, new Date(o.departEstimated).getTime()),
      0,
    );
    const more = await transitClient.planTrip(from.id, to.id, {
      when: new Date(lastDepart + 60_000),
      arriveBy: false,
    });
    setOptions((prev) => {
      const existingIds = new Set((prev ?? []).map((o) => o.id));
      const fresh = more.filter((o) => !existingIds.has(o.id));
      return [...(prev ?? []), ...fresh];
    });
    setLoadingMore(false);
  };

  const timeModeLabelKey: Record<TimeMode, string> = { now: 'leaveNow', depart: 'departAt', arrive: 'arriveBy' };

  return (
    <div className="trip-planner">
      <div className="trip-picker-row">
        <div className="trip-picker-stack">
          <StopField label={t('fromLabel')} value={from} onPress={() => setPicking('from')} />
          <StopField label={t('toLabel')} value={to} onPress={() => setPicking('to')} />
        </div>
        <button className="swap-button" onClick={swap} aria-label="Swap from and to" disabled={!from && !to}>
          ⇄
        </button>
      </div>

      <div className="time-mode-row">
        {(['now', 'depart', 'arrive'] as const).map((mode) => (
          <button
            key={mode}
            className={`time-mode-button ${timeMode === mode ? 'active' : ''}`}
            onClick={() => setTimeMode(mode)}
          >
            {t(timeModeLabelKey[mode])}
          </button>
        ))}
      </div>

      {timeMode !== 'now' && (
        <div className="time-picker-row">
          <input
            className="time-picker-input"
            type="date"
            value={whenDate}
            onChange={(e) => setWhenDate(e.target.value)}
          />
          <input
            className="time-picker-input"
            type="time"
            value={whenTime}
            onChange={(e) => setWhenTime(e.target.value)}
          />
        </div>
      )}

      {picking && (
        <StopSelectorSheet
          label={picking === 'from' ? t('fromLabel') : t('toLabel')}
          onClose={() => setPicking(null)}
          onSelect={(stop) => {
            if (picking === 'from') setFrom(stop);
            else setTo(stop);
            setPicking(null);
          }}
        />
      )}

      {from && to && from.id === to.id && <p className="empty-message">{t('pickDifferentStations')}</p>}

      {loading && <p className="empty-message">{t('findingTrips')}</p>}

      {options && options.length > 0 && timeMode !== 'now' && (
        <p className="trip-time-context">
          {t(timeMode === 'arrive' ? 'arrivingContext' : 'departingContext', {
            time: whenTime,
            date: new Date(`${whenDate}T${whenTime}`).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
            }),
          })}
        </p>
      )}

      {options && options.length === 0 && !loading && <p className="empty-message">{t('noRouteFound')}</p>}

      {options && options.length > 0 && (
        <ul className="trip-options">
          {options.map((option) => {
            const expanded = expandedId === option.id;
            return (
              <li key={option.id} className="trip-option">
                <button
                  className="trip-option-header"
                  onClick={() => setExpandedId(expanded ? null : option.id)}
                  aria-expanded={expanded}
                >
                  <div className="trip-option-summary">
                    <span className="trip-option-times">
                      {formatClockTime(option.departEstimated)} → {formatClockTime(option.arriveEstimated)}
                    </span>
                    <span className="trip-option-route">
                      {option.legs.map((leg, i) => (
                        <span key={i} className="trip-option-route-step">
                          <ModeIcon mode={leg.mode} />
                          {i < option.legs.length - 1 && <span className="trip-option-route-arrow">→</span>}
                        </span>
                      ))}
                    </span>
                  </div>
                  <span className="trip-option-duration">
                    {t('minutesSuffix', { n: option.totalMinutes })}
                    <span className="trip-option-chevron">{expanded ? '▲' : '▼'}</span>
                  </span>
                </button>

                {expanded && (
                  <ul className="trip-legs">
                    {option.legs.map((leg, i) => (
                      <li key={i}>
                        <div className="trip-leg">
                          <ModeIcon mode={leg.mode} />
                          <div className="trip-leg-main">
                            <span className="trip-leg-line">{leg.line}</span>
                            <span className="trip-leg-stops">
                              {leg.fromStop.name} → {leg.toStop.name}
                            </span>
                          </div>
                          <div className="trip-leg-time">
                            <span>
                              {formatClockTime(leg.departEstimated)}
                              {leg.platform && (
                                <span className="trip-leg-platform"> · {t('platformShort', { platform: leg.platform })}</span>
                              )}
                            </span>
                            <StatusBadge
                              scheduled={leg.departScheduled}
                              estimated={leg.departEstimated}
                              cancelled={leg.cancelled}
                            />
                          </div>
                        </div>
                        {i < option.legs.length - 1 && (
                          <div className="trip-transfer">
                            {t('transferAt', { station: shortStopName(leg.toStop.name) })}
                            {leg.arrivalPlatform && option.legs[i + 1].platform && (
                              <>
                                {': '}
                                {t('platformShort', { platform: leg.arrivalPlatform })}
                                {' → '}
                                {t('platformShort', { platform: option.legs[i + 1].platform! })}
                              </>
                            )}
                            {' — '}
                            {t('waitMin', { n: transferMinutes(leg.arriveEstimated, option.legs[i + 1].departEstimated) })}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {options && options.length > 0 && timeMode !== 'arrive' && (
        <button className="load-more-trips" onClick={loadMoreTrips} disabled={loadingMore}>
          {loadingMore ? t('loadingMore') : t('showLaterTrips')}
        </button>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop } from '../types';
import { filterByName } from '../utils';
import { StopList } from './StopList';

interface NearbyStopsProps {
  isFavorite: (stopId: string) => boolean;
  onToggleFavorite: (stopId: string) => void;
  onSelect: (stopId: string) => void;
}

export function NearbyStops({ isFavorite, onToggleFavorite, onSelect }: NearbyStopsProps) {
  const { lat, lon, error, loading } = useGeolocation();
  const [stops, setStops] = useState<Stop[]>([]);
  const [filter, setFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (lat != null && lon != null) {
      transitClient.nearbyStops(lat, lon).then(setStops);
    }
  }, [lat, lon]);

  if (loading) return <p className="empty-message">{t('findingLocation')}</p>;
  if (error) return <p className="empty-message">{t('locationError', { error })}</p>;

  return (
    <div>
      <input
        className="search-input"
        type="search"
        placeholder={t('filterNearbyPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <StopList
        stops={filterByName(stops, filter)}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onSelect={onSelect}
        emptyMessage={t('noNearbyStops')}
      />
    </div>
  );
}

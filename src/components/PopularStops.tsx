import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop } from '../types';
import { filterByName } from '../utils';
import { StopList } from './StopList';

interface PopularStopsProps {
  isFavorite: (stopId: string) => boolean;
  onToggleFavorite: (stopId: string) => void;
  onSelect: (stopId: string) => void;
}

export function PopularStops({ isFavorite, onToggleFavorite, onSelect }: PopularStopsProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [filter, setFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    transitClient.popularStops().then(setStops);
  }, []);

  return (
    <div>
      <input
        className="search-input"
        type="search"
        placeholder={t('filterPopularPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <StopList
        stops={filterByName(stops, filter)}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onSelect={onSelect}
        emptyMessage={t('noStopsFound')}
      />
    </div>
  );
}

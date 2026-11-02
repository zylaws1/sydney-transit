import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop } from '../types';
import { filterByName } from '../utils';
import { StopList } from './StopList';

interface FavoritesProps {
  favoriteIds: string[];
  isFavorite: (stopId: string) => boolean;
  onToggleFavorite: (stopId: string) => void;
  onSelect: (stopId: string) => void;
}

export function Favorites({ favoriteIds, isFavorite, onToggleFavorite, onSelect }: FavoritesProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [filter, setFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    transitClient.getStopsByIds(favoriteIds).then(setStops);
  }, [favoriteIds]);

  if (stops.length === 0) {
    return <p className="empty-message">{t('noFavoritesYet')}</p>;
  }

  return (
    <div>
      <input
        className="search-input"
        type="search"
        placeholder={t('filterFavoritesPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <StopList
        stops={filterByName(stops, filter)}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onSelect={onSelect}
        emptyMessage={t('noMatchingFavorites')}
      />
    </div>
  );
}

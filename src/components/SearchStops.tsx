import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop } from '../types';
import { StopList } from './StopList';

interface SearchStopsProps {
  isFavorite: (stopId: string) => boolean;
  onToggleFavorite: (stopId: string) => void;
  onSelect: (stopId: string) => void;
}

export function SearchStops({ isFavorite, onToggleFavorite, onSelect }: SearchStopsProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stop[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const handle = setTimeout(() => {
      transitClient.searchStops(query).then(setResults);
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div>
      <input
        className="search-input"
        type="search"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <StopList
        stops={results}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onSelect={onSelect}
        emptyMessage={query ? t('noStopsFound') : t('startTypingToSearch')}
      />
    </div>
  );
}

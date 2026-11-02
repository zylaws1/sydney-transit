import { useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop } from '../types';
import { ByLine } from './ByLine';
import { Favorites } from './Favorites';
import { type CategoryId, HomeMenu } from './HomeMenu';
import { NearbyStops } from './NearbyStops';
import { PopularStops } from './PopularStops';
import { SearchStops } from './SearchStops';
import { StopMapPicker } from './StopMapPicker';

type PickerCategory = Exclude<CategoryId, 'plantrip' | 'premium' | 'account' | 'settings' | 'privacy'>;

const PICKER_CATEGORIES: PickerCategory[] = ['closest', 'byname', 'byline', 'bymap', 'popular', 'favorites'];

const CATEGORY_TITLE_KEYS: Record<PickerCategory, string> = {
  closest: 'categoryClosestTitle',
  byname: 'categoryBynameTitle',
  byline: 'categoryBylineTitle',
  bymap: 'categoryBymapTitle',
  popular: 'categoryPopularTitle',
  favorites: 'categoryFavoritesTitle',
};

interface StopSelectorSheetProps {
  label: string;
  onSelect: (stop: Stop) => void;
  onClose: () => void;
}

export function StopSelectorSheet({ label, onSelect, onClose }: StopSelectorSheetProps) {
  const [category, setCategory] = useState<PickerCategory | null>(null);
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const { t } = useLanguage();

  const handleSelect = async (stopId: string) => {
    const [stop] = await transitClient.getStopsByIds([stopId]);
    if (stop) onSelect(stop);
  };

  return (
    <div className="stop-selector-overlay">
      <div className="stop-selector-sheet">
        <header className="stop-selector-header">
          <button className="header-back" onClick={() => (category ? setCategory(null) : onClose())}>
            {category ? t('navBack') : t('navCancel')}
          </button>
          <span className="header-title">
            {category ? t(CATEGORY_TITLE_KEYS[category]) : t('selectStationTitle', { label })}
          </span>
        </header>
        <div className="stop-selector-body">
          {category === null ? (
            <HomeMenu categories={PICKER_CATEGORIES} onSelect={(id) => setCategory(id as PickerCategory)} />
          ) : category === 'closest' ? (
            <NearbyStops isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onSelect={handleSelect} />
          ) : category === 'byname' ? (
            <SearchStops isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onSelect={handleSelect} />
          ) : category === 'byline' ? (
            <ByLine isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onSelect={handleSelect} />
          ) : category === 'bymap' ? (
            <StopMapPicker onSelect={handleSelect} />
          ) : category === 'popular' ? (
            <PopularStops isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onSelect={handleSelect} />
          ) : (
            <Favorites
              favoriteIds={favoriteIds}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

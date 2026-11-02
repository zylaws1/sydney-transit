import { useState } from 'react';
import './App.css';
import { ByLine } from './components/ByLine';
import { DeparturesList } from './components/DeparturesList';
import { Favorites } from './components/Favorites';
import { type CategoryId, HomeMenu } from './components/HomeMenu';
import { NearbyStops } from './components/NearbyStops';
import { PopularStops } from './components/PopularStops';
import { AccountScreen } from './components/AccountScreen';
import { GoPremium } from './components/GoPremium';
import { PrivacyPolicyScreen } from './components/PrivacyPolicyScreen';
import { SearchStops } from './components/SearchStops';
import { SettingsScreen } from './components/SettingsScreen';
import { StopMapPicker } from './components/StopMapPicker';
import { TripPlanner } from './components/TripPlanner';
import { transitClient } from './data/transitClient';
import { useFavorites } from './hooks/useFavorites';
import { useLanguage } from './i18n/LanguageContext';
import type { Stop } from './types';

const CATEGORY_TITLE_KEYS: Record<CategoryId, string> = {
  plantrip: 'categoryPlantripTitle',
  closest: 'categoryClosestTitle',
  byname: 'categoryBynameTitle',
  byline: 'categoryBylineTitle',
  bymap: 'categoryBymapTitle',
  popular: 'categoryPopularTitle',
  favorites: 'categoryFavoritesTitle',
  premium: 'categoryPremiumTitle',
  account: 'categoryAccountTitle',
  settings: 'categorySettingsTitle',
  privacy: 'categoryPrivacyTitle',
};

function App() {
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const { t } = useLanguage();

  const handleSelect = async (stopId: string) => {
    const [stop] = await transitClient.getStopsByIds([stopId]);
    if (stop) setSelectedStop(stop);
  };

  const goHome = () => {
    setSelectedStop(null);
    setCategory(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        {category || selectedStop ? (
          <button className="header-back" onClick={goHome} aria-label={t('favoritesAria')}>
            {t('navHome')}
          </button>
        ) : (
          <h1>{t('appTitle')}</h1>
        )}
        {category && !selectedStop && (
          <span className="header-title">{t(CATEGORY_TITLE_KEYS[category])}</span>
        )}
        <div className="header-icons">
          {category !== 'favorites' && (
            <button
              className="header-icon-button favorite"
              aria-label={t('favoritesAria')}
              onClick={() => {
                setSelectedStop(null);
                setCategory('favorites');
              }}
            >
              ★
            </button>
          )}
          {category !== 'account' && (
            <button
              className="header-icon-button"
              aria-label={t('accountAria')}
              onClick={() => {
                setSelectedStop(null);
                setCategory('account');
              }}
            >
              👤
            </button>
          )}
          {category !== 'settings' && (
            <button
              className="header-icon-button"
              aria-label={t('settingsAria')}
              onClick={() => {
                setSelectedStop(null);
                setCategory('settings');
              }}
            >
              ⚙️
            </button>
          )}
        </div>
      </header>

      <main className="app-content">
        {selectedStop ? (
          <DeparturesList
            stop={selectedStop}
            onBack={() => setSelectedStop(null)}
            onUpgradeClick={() => {
              setSelectedStop(null);
              setCategory('premium');
            }}
          />
        ) : category === null ? (
          <HomeMenu onSelect={setCategory} />
        ) : category === 'plantrip' ? (
          <TripPlanner />
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
        ) : category === 'favorites' ? (
          <Favorites
            favoriteIds={favoriteIds}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onSelect={handleSelect}
          />
        ) : category === 'premium' ? (
          <GoPremium />
        ) : category === 'account' ? (
          <AccountScreen />
        ) : category === 'settings' ? (
          <SettingsScreen
            onManagePremium={() => setCategory('premium')}
            onOpenPrivacy={() => setCategory('privacy')}
          />
        ) : (
          <PrivacyPolicyScreen />
        )}
      </main>

      {category === null && !selectedStop && (
        <footer className="app-footer">
          <a href="https://vber-ai.com" target="_blank" rel="noopener noreferrer" className="vber-brand">
            <img src="/icons/vber-logo.svg" alt="" className="vber-logo" width="18" height="18" />
            Developed by vber<span className="vber-dot">.</span>ai
          </a>
        </footer>
      )}
    </div>
  );
}

export default App;

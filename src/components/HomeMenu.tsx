import { useLanguage } from '../i18n/LanguageContext';

export type CategoryId =
  | 'plantrip'
  | 'closest'
  | 'byname'
  | 'byline'
  | 'bymap'
  | 'popular'
  | 'favorites'
  | 'premium'
  | 'account'
  | 'settings'
  | 'privacy';

interface Category {
  id: CategoryId;
  icon: string;
  titleKey: string;
  subtitleKey: string;
}

const CATEGORIES: Category[] = [
  { id: 'plantrip', icon: '🧭', titleKey: 'categoryPlantripTitle', subtitleKey: 'categoryPlantripSubtitle' },
  { id: 'closest', icon: '📍', titleKey: 'categoryClosestTitle', subtitleKey: 'categoryClosestSubtitle' },
  { id: 'byname', icon: '🔤', titleKey: 'categoryBynameTitle', subtitleKey: 'categoryBynameSubtitle' },
  { id: 'byline', icon: '🚆', titleKey: 'categoryBylineTitle', subtitleKey: 'categoryBylineSubtitle' },
  { id: 'bymap', icon: '🗺️', titleKey: 'categoryBymapTitle', subtitleKey: 'categoryBymapSubtitle' },
  { id: 'popular', icon: '🔥', titleKey: 'categoryPopularTitle', subtitleKey: 'categoryPopularSubtitle' },
  { id: 'favorites', icon: '★', titleKey: 'categoryFavoritesTitle', subtitleKey: 'categoryFavoritesSubtitle' },
  { id: 'premium', icon: '💎', titleKey: 'categoryPremiumTitle', subtitleKey: 'categoryPremiumSubtitle' },
];

interface HomeMenuProps {
  onSelect: (id: CategoryId) => void;
  categories?: CategoryId[];
}

export function HomeMenu({ onSelect, categories }: HomeMenuProps) {
  const { t } = useLanguage();
  const list = categories ? CATEGORIES.filter((c) => categories.includes(c.id)) : CATEGORIES;
  return (
    <div className="home-menu">
      {list.map((cat) => (
        <button key={cat.id} className="home-card" onClick={() => onSelect(cat.id)}>
          <span className="home-card-icon">{cat.icon}</span>
          <span className="home-card-text">
            <span className="home-card-title">{t(cat.titleKey)}</span>
            <span className="home-card-subtitle">{t(cat.subtitleKey)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { transitClient } from '../data/transitClient';
import { useLanguage } from '../i18n/LanguageContext';
import type { Stop, TransportLine } from '../types';
import { filterByName } from '../utils';
import { ModeIcon } from './ModeIcon';
import { StopList } from './StopList';

interface ByLineProps {
  isFavorite: (stopId: string) => boolean;
  onToggleFavorite: (stopId: string) => void;
  onSelect: (stopId: string) => void;
}

export function ByLine({ isFavorite, onToggleFavorite, onSelect }: ByLineProps) {
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<TransportLine | null>(null);
  const [lineStops, setLineStops] = useState<Stop[]>([]);
  const [filter, setFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    transitClient.getLines().then(setLines);
  }, []);

  useEffect(() => {
    if (selectedLine) {
      transitClient.stopsForLine(selectedLine.id).then(setLineStops);
    }
  }, [selectedLine]);

  if (selectedLine) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelectedLine(null); setFilter(''); }}>
          {t('allLinesBack')}
        </button>
        <h3 className="section-title">
          <ModeIcon mode={selectedLine.mode} /> {selectedLine.name}
        </h3>
        <input
          className="search-input"
          type="search"
          placeholder={t('filterStopsOnLinePlaceholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <StopList
          stops={filterByName(lineStops, filter)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelect}
          emptyMessage={t('noMatchingStopsOnLine')}
        />
      </div>
    );
  }

  const filteredLines = filterByName(lines, filter);

  return (
    <div>
      <input
        className="search-input"
        type="search"
        placeholder={t('filterLinesPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filteredLines.length === 0 ? (
        <p className="empty-message">{t('noMatchingLines')}</p>
      ) : (
        <ul className="stop-list">
          {filteredLines.map((line) => (
            <li key={line.id} className="stop-row">
              <button className="stop-main" onClick={() => setSelectedLine(line)}>
                <span className="stop-name">{line.name}</span>
                <ModeIcon mode={line.mode} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

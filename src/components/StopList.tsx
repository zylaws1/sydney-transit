import type { Stop } from '../types';
import { ModeIcon } from './ModeIcon';

interface StopListProps {
  stops: Stop[];
  isFavorite: (stopId: string) => boolean;
  onToggleFavorite: (stopId: string) => void;
  onSelect: (stopId: string) => void;
  emptyMessage: string;
}

export function StopList({ stops, isFavorite, onToggleFavorite, onSelect, emptyMessage }: StopListProps) {
  if (stops.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <ul className="stop-list">
      {stops.map((stop) => (
        <li key={stop.id} className="stop-row">
          <button className="stop-main" onClick={() => onSelect(stop.id)}>
            <span className="stop-name">{stop.name}</span>
            <span className="stop-modes">
              {stop.modes.map((m) => (
                <ModeIcon key={m} mode={m} />
              ))}
            </span>
          </button>
          <button
            className={`favorite-toggle ${isFavorite(stop.id) ? 'active' : ''}`}
            aria-label={isFavorite(stop.id) ? 'Remove favorite' : 'Add favorite'}
            onClick={() => onToggleFavorite(stop.id)}
          >
            {isFavorite(stop.id) ? '★' : '☆'}
          </button>
        </li>
      ))}
    </ul>
  );
}

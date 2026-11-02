import type { TransportMode } from '../types';

const ICONS: Record<TransportMode, string> = {
  train: '🚆',
  bus: '🚌',
  ferry: '⛴️',
  lightrail: '🚊',
  metro: '🚇',
};

export function ModeIcon({ mode }: { mode: TransportMode }) {
  return (
    <span className="mode-icon" aria-label={mode} title={mode}>
      {ICONS[mode]}
    </span>
  );
}

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { transitClient } from '../data/transitClient';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage } from '../i18n/LanguageContext';
import type { TransportMode } from '../types';

const MODE_ICONS: Record<TransportMode, string> = {
  train: '🚆',
  bus: '🚌',
  ferry: '⛴️',
  lightrail: '🚊',
  metro: '🚇',
};

const SYDNEY_CENTER: [number, number] = [-33.8688, 151.2093];

interface StopMapPickerProps {
  onSelect: (stopId: string) => void;
}

export function StopMapPicker({ onSelect }: StopMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const { lat, lon } = useGeolocation();
  const { t } = useLanguage();
  const selectLabelRef = useRef(t('selectThisStation'));
  selectLabelRef.current = t('selectThisStation');

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(SYDNEY_CENTER, 11);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    transitClient.allStops().then((stops) => {
      stops.forEach((stop) => {
        const icon = L.divIcon({
          className: 'map-stop-marker',
          html: `<span>${MODE_ICONS[stop.modes[0]] ?? '🚉'}</span>`,
          iconSize: [26, 26],
        });
        const popupEl = document.createElement('div');
        popupEl.className = 'map-popup';
        popupEl.innerHTML = `
          <strong>${stop.name}</strong>
          <div class="map-popup-modes">${stop.modes.map((m) => MODE_ICONS[m] ?? '').join(' ')}</div>
          <button class="map-popup-select" type="button">${selectLabelRef.current}</button>
        `;
        popupEl.querySelector('.map-popup-select')?.addEventListener('click', () => {
          onSelectRef.current(stop.id);
        });
        L.marker([stop.lat, stop.lon], { icon }).addTo(map).bindPopup(popupEl);
      });
    });

    const resizeHandle = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      cancelAnimationFrame(resizeHandle);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lat != null && lon != null) {
      mapRef.current?.setView([lat, lon], 14);
    }
  }, [lat, lon]);

  return <div ref={containerRef} className="stop-map" />;
}

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'favorite-stop-ids';

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const toggleFavorite = useCallback((stopId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(stopId) ? prev.filter((id) => id !== stopId) : [...prev, stopId],
    );
  }, []);

  const isFavorite = useCallback((stopId: string) => favoriteIds.includes(stopId), [favoriteIds]);

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  return { favoriteIds, toggleFavorite, isFavorite, clearFavorites };
}

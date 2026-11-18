import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage.js';

const FavoritesContext = createContext(null);
const MAX_FAVORITES = 20;

/** Two locations are the same place if they share an id or are ~1 km apart. */
export const sameLocation = (a, b) =>
  !!a && !!b && (a.id === b.id || (Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01));

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    const saved = loadJSON('favorites', []);
    return Array.isArray(saved) ? saved.filter((f) => typeof f?.latitude === 'number') : [];
  });

  useEffect(() => saveJSON('favorites', favorites), [favorites]);

  const isFavorite = useCallback((loc) => favorites.some((f) => sameLocation(f, loc)), [favorites]);

  const add = useCallback((loc) => {
    setFavorites((list) => (list.some((f) => sameLocation(f, loc)) ? list : [...list, loc].slice(-MAX_FAVORITES)));
  }, []);

  const remove = useCallback((loc) => {
    setFavorites((list) => list.filter((f) => !sameLocation(f, loc)));
  }, []);

  /** Returns true if the location is a favorite after toggling. */
  const toggle = useCallback(
    (loc) => {
      if (isFavorite(loc)) {
        remove(loc);
        return false;
      }
      add(loc);
      return true;
    },
    [add, remove, isFavorite],
  );

  const value = useMemo(() => ({ favorites, add, remove, toggle, isFavorite }), [favorites, add, remove, toggle, isFavorite]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}

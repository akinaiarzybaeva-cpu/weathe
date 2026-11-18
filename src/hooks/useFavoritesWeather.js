import { useMemo } from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { getMultiForecast } from '../services/api.js';
import { useAsync } from './useAsync.js';

/** Current + 7-day summary for every saved favorite, in one batched request. */
export function useFavoritesWeather() {
  const { favorites } = useFavorites();
  const key = favorites.map((f) => `${f.latitude.toFixed(3)},${f.longitude.toFixed(3)}`).join('|');
  const res = useAsync(() => getMultiForecast(favorites), [key], { enabled: favorites.length > 0 });
  const byId = useMemo(() => {
    if (!res.data) return null;
    return Object.fromEntries(favorites.map((f, i) => [f.id, res.data[i]]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.data]);
  return { ...res, data: byId, favorites };
}

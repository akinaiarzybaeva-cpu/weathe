import { useMemo } from 'react';
import { KG_CITIES } from '../data/kyrgyzstan.js';
import { getMultiForecast } from '../services/api.js';
import { useAsync } from './useAsync.js';

/**
 * Current weather for all major Kyrgyz cities in a single batched request.
 * Returns { data: { [cityId]: openMeteoResponse }, loading, error, reload }.
 */
export function useKgWeather() {
  const res = useAsync(() => getMultiForecast(KG_CITIES), []);
  const byId = useMemo(() => {
    if (!res.data) return null;
    return Object.fromEntries(KG_CITIES.map((c, i) => [c.id, res.data[i]]));
  }, [res.data]);
  return { ...res, data: byId };
}

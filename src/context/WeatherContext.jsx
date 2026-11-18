import { createContext, useContext, useMemo } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { getAirQuality, getForecast } from '../services/api.js';
import { deriveAlerts } from '../lib/alerts.js';
import { useSelectedLocation } from './LocationContext.jsx';
import { useSettings } from './SettingsContext.jsx';

const WeatherContext = createContext(null);

/**
 * Loads forecast + air quality for the selected location ONCE and shares it
 * with every page (dashboard, forecast, air, assistant, alerts…).
 */
export function WeatherProvider({ children }) {
  const { location } = useSelectedLocation();
  const { settings } = useSettings();
  const key = `${location.latitude},${location.longitude}`;

  const forecast = useAsync(() => getForecast(location), [key]);
  const air = useAsync(() => getAirQuality(location), [key]);

  const alerts = useMemo(
    () => (settings.alertsEnabled && forecast.data ? deriveAlerts(forecast.data) : []),
    [forecast.data, settings.alertsEnabled],
  );

  const value = useMemo(() => ({ location, forecast, air, alerts }), [location, forecast, air, alerts]);
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used inside WeatherProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage.js';
import { DEFAULT_LOCATION } from '../data/kyrgyzstan.js';
import { reverseGeocode } from '../services/api.js';
import { useI18n, useSettings } from './SettingsContext.jsx';
import { useToast } from './ToastContext.jsx';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => loadJSON('location', DEFAULT_LOCATION));
  const [locating, setLocating] = useState(false);
  const { settings } = useSettings();
  const { t, lang } = useI18n();
  const { notify } = useToast();
  const autoTried = useRef(false);

  const setLocation = useCallback((loc) => {
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return;
    setLocationState(loc);
  }, []);

  useEffect(() => saveJSON('location', location), [location]);

  /** Ask the browser for the user's position (requires user permission). */
  const locate = useCallback(
    ({ silent = false } = {}) =>
      new Promise((resolve) => {
        if (!('geolocation' in navigator)) {
          if (!silent) notify(t('settings.locationUnsupported'), 'error');
          resolve(null);
          return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            let loc;
            try {
              loc = await reverseGeocode(coords.latitude, coords.longitude, lang === 'ky' ? 'ky' : lang);
            } catch {
              loc = {
                id: `gps-${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`,
                name: `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
                country: '',
                countryCode: '',
                latitude: coords.latitude,
                longitude: coords.longitude,
                isGps: true,
              };
            }
            setLocation(loc);
            setLocating(false);
            if (!silent) notify(t('settings.locationFound', { place: loc.name }), 'success');
            resolve(loc);
          },
          (err) => {
            setLocating(false);
            if (!silent) {
              notify(err.code === err.PERMISSION_DENIED ? t('settings.locationDenied') : t('settings.locationUnavailable'), 'error');
            }
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
        );
      }),
    [lang, notify, setLocation, t],
  );

  // Optional automatic detection on start (only if the user enabled it).
  useEffect(() => {
    if (settings.autoLocate && !autoTried.current) {
      autoTried.current = true;
      locate({ silent: true });
    }
  }, [settings.autoLocate, locate]);

  const value = useMemo(() => ({ location, setLocation, locate, locating }), [location, setLocation, locate, locating]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useSelectedLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useSelectedLocation must be used inside LocationProvider');
  return ctx;
}

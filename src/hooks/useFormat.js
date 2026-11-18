import { useMemo } from 'react';
import { useI18n, useSettings } from '../context/SettingsContext.jsx';
import { convertPressure, convertTemp, convertWind, degToCompass } from '../lib/units.js';
import { capitalize, formatDate, formatTime, formatWeekday } from '../lib/time.js';
import { KG_CITIES } from '../data/kyrgyzstan.js';

const KG_REGION_OF = Object.fromEntries(KG_CITIES.map((c) => [c.id, c.region]));

/**
 * Formatting helpers bound to the user's units and language.
 * All inputs are metric values exactly as returned by the API.
 */
export function useFormat() {
  const { settings } = useSettings();
  const { t, locale } = useI18n();
  const { tempUnit, windUnit, pressureUnit } = settings;

  return useMemo(() => {
    const num = (v, digits = 0) =>
      v == null || Number.isNaN(v) ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v);

    const tempValue = (c) => {
      const v = convertTemp(c, tempUnit);
      return v == null ? null : Math.round(v);
    };
    const temp = (c) => {
      const v = tempValue(c);
      return v == null ? '—' : `${num(v)}°`;
    };
    const tempUnitLabel = tempUnit === 'f' ? '°F' : '°C';
    const tempFull = (c) => (c == null ? '—' : `${temp(c)}${tempUnit === 'f' ? 'F' : 'C'}`);

    const windLabel = t(`settings.${windUnit}`);
    const windValue = (kmh) => {
      const v = convertWind(kmh, windUnit);
      return v == null ? null : windUnit === 'ms' ? Math.round(v * 10) / 10 : Math.round(v);
    };
    const wind = (kmh) => (kmh == null ? '—' : `${num(windValue(kmh), 1)} ${windLabel}`);

    const direction = (deg) => {
      const c = degToCompass(deg);
      return c ? t(`dir.${c}`) : '—';
    };

    const pressure = (hpa) => {
      const v = convertPressure(hpa, pressureUnit);
      return v == null ? '—' : `${num(Math.round(v))} ${t(`settings.${pressureUnit}`)}`;
    };

    const mm = (v) => (v == null ? '—' : `${num(v, 1)} ${t('common.mm')}`);
    const cm = (v) => (v == null ? '—' : `${num(v, 1)} ${t('common.cm')}`);
    const pct = (v) => (v == null ? '—' : `${num(Math.round(v))}%`);
    const km = (meters) => (meters == null ? '—' : `${num(meters / 1000, meters < 10000 ? 1 : 0)} ${t('common.km')}`);

    const time = (iso) => formatTime(iso, locale);
    const weekday = (iso, style = 'short') => capitalize(formatWeekday(iso, locale, style));
    const date = (iso, opts) => formatDate(iso, locale, opts);

    /** "Today", "Tomorrow" or the weekday name, relative to the location's local date. */
    const dayName = (isoDate, todayIso, style = 'short') => {
      if (todayIso && isoDate === todayIso.slice(0, 10)) return t('common.today');
      if (todayIso) {
        const tomorrow = new Date(`${todayIso.slice(0, 10)}T00:00:00Z`);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        if (isoDate === tomorrow.toISOString().slice(0, 10)) return t('common.tomorrow');
      }
      return weekday(isoDate, style);
    };

    const duration = (seconds) => {
      if (seconds == null) return '—';
      const h = Math.floor(seconds / 3600);
      const m = Math.round((seconds % 3600) / 60);
      return t('common.hoursMinutes', { h, m });
    };

    const condition = (code) => {
      const v = t(`wmo.${code}`);
      return v === `wmo.${code}` ? t('wmo.unknown') : v;
    };

    /** Localised display name for a location. Kyrgyz cities use translations. */
    const placeName = (loc) => {
      if (!loc) return '';
      if (loc.kgId) return t(`kg.cities.${loc.kgId}`);
      return loc.name;
    };
    const placeSubtitle = (loc) => {
      if (!loc) return '';
      if (loc.kgId) return t('kg.regions.' + (KG_REGION_OF[loc.kgId] || 'chuy'));
      return [loc.admin1, loc.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
    };

    return {
      num,
      temp,
      tempValue,
      tempFull,
      tempUnitLabel,
      wind,
      windValue,
      windLabel,
      direction,
      pressure,
      mm,
      cm,
      pct,
      km,
      time,
      weekday,
      date,
      dayName,
      duration,
      condition,
      placeName,
      placeSubtitle,
      locale,
    };
  }, [t, locale, tempUnit, windUnit, pressureUnit]);
}


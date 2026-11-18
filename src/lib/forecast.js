import { currentHourIndex } from './time.js';

const HOURLY_KEYS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'visibility',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'uv_index',
  'is_day',
];

function hourAt(h, i) {
  const row = { time: h.time[i] };
  for (const k of HOURLY_KEYS) row[k] = h[k]?.[i] ?? null;
  return row;
}

/** Next `count` hourly rows starting at the current local hour. */
export function nextHours(forecast, count = 24) {
  const h = forecast?.hourly;
  if (!h?.time) return [];
  const start = currentHourIndex(h.time, forecast.current?.time);
  const out = [];
  for (let i = start; i < Math.min(h.time.length, start + count); i++) out.push(hourAt(h, i));
  return out;
}

/** All hourly rows for a local date (YYYY-MM-DD). */
export function hoursForDate(forecast, date) {
  const h = forecast?.hourly;
  if (!h?.time) return [];
  const out = [];
  h.time.forEach((t, i) => t.startsWith(date) && out.push(hourAt(h, i)));
  return out;
}

const DAILY_KEYS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'sunrise',
  'sunset',
  'daylight_duration',
  'uv_index_max',
  'precipitation_sum',
  'rain_sum',
  'showers_sum',
  'snowfall_sum',
  'precipitation_hours',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
];

/** Daily rows as objects. */
export function dailyRows(forecast) {
  const d = forecast?.daily;
  if (!d?.time) return [];
  return d.time.map((time, i) => {
    const row = { time };
    for (const k of DAILY_KEYS) row[k] = d[k]?.[i] ?? null;
    return row;
  });
}

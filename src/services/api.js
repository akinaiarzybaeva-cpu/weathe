/**
 * Centralised API service for WEATHERLY PRO.
 *
 * - All weather data comes from real providers (Open-Meteo, RainViewer,
 *   BigDataCloud reverse geocoding). None of them needs a key.
 * - Optional features that need secrets (AI assistant, OpenWeatherMap tiles)
 *   go through the local server middleware at /api/* so keys stay server-side.
 * - Every GET is cached in memory with a TTL, and identical in-flight requests
 *   are de-duplicated, so components can call these freely without causing
 *   duplicate network traffic.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';

const MIN = 60 * 1000;
const cache = new Map(); // url -> { expires, data }
const inflight = new Map(); // url -> Promise

export class ApiError extends Error {
  constructor(message, { status, kind = 'http' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind; // 'http' | 'network' | 'notFound' | 'config'
  }
}

async function request(url, init) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new ApiError(err?.message || 'Network error', { kind: 'network' });
  }
  if (!res.ok) {
    let reason = res.statusText;
    try {
      const body = await res.json();
      reason = body.reason || body.error || body.message || reason;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(reason || `HTTP ${res.status}`, { status: res.status });
  }
  return res.json();
}

/** Cached + de-duplicated GET returning parsed JSON. */
export function getJSON(url, ttl = 10 * MIN) {
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.data);
  if (inflight.has(url)) return inflight.get(url);

  const p = request(url)
    .then((data) => {
      cache.set(url, { data, expires: Date.now() + ttl });
      return data;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

export function clearCache() {
  cache.clear();
}

const qs = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`)
    .join('&');

const round = (n, d = 3) => Number(n).toFixed(d);

/* ------------------------------------------------------------------ */
/* Forecast                                                            */
/* ------------------------------------------------------------------ */

const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'visibility',
  'uv_index',
  'dew_point_2m',
];

const HOURLY_VARS = [
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

const DAILY_VARS = [
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

/** Full forecast: current conditions, 8 days hourly (today + 7) and daily. */
export function getForecast({ latitude, longitude }) {
  const url = `${FORECAST_URL}?${qs({
    latitude: round(latitude),
    longitude: round(longitude),
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    timezone: 'auto',
    forecast_days: 8,
    wind_speed_unit: 'kmh',
  })}`;
  return getJSON(url, 10 * MIN);
}

/**
 * Current conditions + 7-day daily summary for many locations in ONE request
 * (Open-Meteo accepts comma-separated coordinate lists).
 */
export async function getMultiForecast(locations) {
  if (!locations.length) return [];
  const url = `${FORECAST_URL}?${qs({
    latitude: locations.map((l) => round(l.latitude)),
    longitude: locations.map((l) => round(l.longitude)),
    current: ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'weather_code', 'is_day', 'wind_speed_10m', 'wind_direction_10m', 'cloud_cover', 'pressure_msl', 'precipitation'],
    daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'precipitation_sum', 'wind_speed_10m_max'],
    timezone: 'auto',
    forecast_days: 7,
  })}`;
  const data = await getJSON(url, 10 * MIN);
  return Array.isArray(data) ? data : [data];
}

/** Daily forecast including the past N days (for week-over-week analytics). */
export function getRecentDaily({ latitude, longitude }, pastDays = 14) {
  const url = `${FORECAST_URL}?${qs({
    latitude: round(latitude),
    longitude: round(longitude),
    daily: ['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean', 'precipitation_sum', 'wind_speed_10m_max', 'relative_humidity_2m_mean'],
    timezone: 'auto',
    past_days: pastDays,
    forecast_days: 7,
  })}`;
  return getJSON(url, 30 * MIN);
}

/* ------------------------------------------------------------------ */
/* Air quality                                                         */
/* ------------------------------------------------------------------ */

export function getAirQuality({ latitude, longitude }) {
  const url = `${AIR_URL}?${qs({
    latitude: round(latitude),
    longitude: round(longitude),
    current: [
      'us_aqi',
      'european_aqi',
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'us_aqi_pm2_5',
      'us_aqi_pm10',
      'us_aqi_carbon_monoxide',
      'us_aqi_nitrogen_dioxide',
      'us_aqi_sulphur_dioxide',
      'us_aqi_ozone',
    ],
    hourly: ['us_aqi', 'pm2_5', 'pm10'],
    timezone: 'auto',
    forecast_days: 2,
  })}`;
  return getJSON(url, 15 * MIN);
}

/* ------------------------------------------------------------------ */
/* Historical (ERA5 archive)                                           */
/* ------------------------------------------------------------------ */

export function getHistory({ latitude, longitude }, startDate, endDate) {
  const url = `${ARCHIVE_URL}?${qs({
    latitude: round(latitude, 2),
    longitude: round(longitude, 2),
    start_date: startDate,
    end_date: endDate,
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'snowfall_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'relative_humidity_2m_mean',
    ],
    timezone: 'auto',
  })}`;
  return getJSON(url, 6 * 60 * MIN);
}

/* ------------------------------------------------------------------ */
/* Geocoding                                                           */
/* ------------------------------------------------------------------ */

export async function searchCities(query, language = 'en') {
  const name = query.trim();
  if (name.length < 2) return [];
  const url = `${GEOCODE_URL}?${qs({ name, count: 8, language, format: 'json' })}`;
  const data = await getJSON(url, 60 * MIN);
  return (data.results || []).map((r) => ({
    id: `geo-${r.id}`,
    name: r.name,
    country: r.country || '',
    countryCode: r.country_code || '',
    admin1: r.admin1 || null,
    latitude: r.latitude,
    longitude: r.longitude,
    population: r.population || null,
  }));
}

export async function reverseGeocode(latitude, longitude, language = 'en') {
  const url = `${REVERSE_URL}?${qs({
    latitude: round(latitude),
    longitude: round(longitude),
    localityLanguage: language,
  })}`;
  const d = await getJSON(url, 60 * MIN);
  return {
    id: `gps-${round(latitude, 2)},${round(longitude, 2)}`,
    name: d.city || d.locality || d.principalSubdivision || `${round(latitude, 2)}, ${round(longitude, 2)}`,
    country: d.countryName || '',
    countryCode: d.countryCode || '',
    admin1: d.principalSubdivision || null,
    latitude,
    longitude,
    isGps: true,
  };
}

/* ------------------------------------------------------------------ */
/* Radar / map grid                                                    */
/* ------------------------------------------------------------------ */

export function getRadarFrames() {
  return getJSON(RAINVIEWER_URL, 5 * MIN);
}

/**
 * Live cloud cover / wind / temperature on an n×n grid inside the given
 * bounds. Coordinates are snapped so panning slightly re-uses the cache.
 */
export async function getGrid(bounds, n = 7) {
  const { south, west, north, east } = bounds;
  const step = Math.max((north - south) / n, (east - west) / n);
  const snap = (v) => Math.round(v / step) * step;
  const pts = [];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const lat = Number(snap(south + ((i + 0.5) * (north - south)) / n).toFixed(2));
      const lon = Number((((snap(west + ((j + 0.5) * (east - west)) / n) + 540) % 360) - 180).toFixed(2));
      const key = `${lat},${lon}`;
      // Snapping can map two cells onto the same point – keep each point once.
      if (lat > -85 && lat < 85 && !seen.has(key)) {
        seen.add(key);
        pts.push({ latitude: lat, longitude: lon });
      }
    }
  }
  const url = `${FORECAST_URL}?${qs({
    latitude: pts.map((p) => round(p.latitude, 2)),
    longitude: pts.map((p) => round(p.longitude, 2)),
    current: ['cloud_cover', 'wind_speed_10m', 'wind_direction_10m', 'temperature_2m', 'weather_code', 'is_day'],
    timezone: 'GMT',
  })}`;
  const data = await getJSON(url, 15 * MIN);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((d, i) => ({ ...pts[i], ...d.current }));
}

/* ------------------------------------------------------------------ */
/* Server middleware (keys stay server-side)                           */
/* ------------------------------------------------------------------ */

export async function getAppConfig() {
  try {
    return await getJSON('/api/config', 5 * MIN);
  } catch {
    return { ai: false, owmTiles: false, unavailable: true };
  }
}

export async function askAssistant(payload) {
  let res;
  try {
    res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('network', { kind: 'network' });
  }
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || body.error) {
    throw new ApiError(body.error || 'generic', { status: res.status, kind: body.error === 'not_configured' ? 'config' : 'http' });
  }
  return body.reply;
}

/** Unit conversions. All API data is fetched in metric (°C, km/h, hPa, mm). */
export const toFahrenheit = (c) => (c * 9) / 5 + 32;

export function convertTemp(c, unit) {
  if (c == null || Number.isNaN(c)) return null;
  return unit === 'f' ? toFahrenheit(c) : c;
}

const WIND_FACTORS = { kmh: 1, ms: 1 / 3.6, mph: 0.621371, kn: 0.539957 };
export function convertWind(kmh, unit) {
  if (kmh == null || Number.isNaN(kmh)) return null;
  return kmh * (WIND_FACTORS[unit] ?? 1);
}

export function convertPressure(hpa, unit) {
  if (hpa == null) return null;
  return unit === 'mmhg' ? hpa * 0.750062 : hpa;
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function degToCompass(deg) {
  if (deg == null) return null;
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export function uvLevel(uv) {
  if (uv == null) return null;
  if (uv < 3) return 'low';
  if (uv < 6) return 'moderate';
  if (uv < 8) return 'high';
  if (uv < 11) return 'veryHigh';
  return 'extreme';
}

export function visibilityLevel(meters) {
  if (meters == null) return null;
  if (meters >= 20000) return 'excellent';
  if (meters >= 10000) return 'good';
  if (meters >= 4000) return 'moderate';
  return 'poor';
}

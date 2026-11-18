/** US EPA AQI categories. Colors follow the EPA scale, softened for the UI. */
export const AQI_LEVELS = [
  { key: 'good', max: 50, color: '#3fbf6f' },
  { key: 'moderate', max: 100, color: '#e3b505' },
  { key: 'usg', max: 150, color: '#f08a24' },
  { key: 'unhealthy', max: 200, color: '#e5484d' },
  { key: 'veryUnhealthy', max: 300, color: '#9b59d0' },
  { key: 'hazardous', max: Infinity, color: '#8e1b3a' },
];

export function aqiLevel(aqi) {
  if (aqi == null || Number.isNaN(aqi)) return { key: 'unknown', color: '#8a93a6', index: -1 };
  const index = AQI_LEVELS.findIndex((l) => aqi <= l.max);
  return { ...AQI_LEVELS[index], index };
}

export const POLLUTANTS = ['pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone'];

/** Pollutant with the highest US sub-index (the one that drives the AQI). */
export function dominantPollutant(current) {
  if (!current) return null;
  let best = null;
  for (const p of POLLUTANTS) {
    const v = current[`us_aqi_${p}`];
    if (v != null && (best == null || v > best.value)) best = { key: p, value: v };
  }
  return best?.key ?? null;
}

/**
 * WHO 2021 air-quality guideline values (μg/m³), used to scale pollutant bars.
 * CO: 4 mg/m³ (24 h); O3: 100 μg/m³ (8 h peak); others 24 h means.
 */
export const WHO_GUIDELINE = {
  pm2_5: 15,
  pm10: 45,
  carbon_monoxide: 4000,
  nitrogen_dioxide: 25,
  sulphur_dioxide: 40,
  ozone: 100,
};

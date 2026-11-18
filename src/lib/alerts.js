import { isStormCode } from './weatherCodes.js';

/**
 * Derive weather alerts from real Open-Meteo daily forecast values.
 * Thresholds are fixed and documented below; nothing is simulated.
 *
 *   storm       WMO code 95 (warning) / 96, 99 with hail (danger)
 *   heavyRain   rain + showers >= 20 mm (warning), >= 50 mm (danger)
 *   snow        snowfall >= 5 cm (warning), >= 15 cm (danger)
 *   strongWind  gusts >= 60 km/h (warning), >= 90 km/h (danger)
 *   heat        max temperature >= 35 °C (warning), >= 40 °C (danger)
 *   cold        min temperature <= -20 °C (warning), <= -30 °C (danger)
 *
 * Returns [{ id, type, severity, date, value, kind, code? }] where `kind`
 * tells the UI which formatter to use: 'mm' | 'cm' | 'wind' | 'temp' | 'code'.
 */
export function deriveAlerts(forecast) {
  const d = forecast?.daily;
  if (!d?.time) return [];
  const alerts = [];
  const days = Math.min(d.time.length, 7);

  for (let i = 0; i < days; i++) {
    const date = d.time[i];
    const code = d.weather_code?.[i];
    const rain = (d.rain_sum?.[i] ?? 0) + (d.showers_sum?.[i] ?? 0);
    const snow = d.snowfall_sum?.[i] ?? 0;
    const gusts = d.wind_gusts_10m_max?.[i] ?? 0;
    const tmax = d.temperature_2m_max?.[i];
    const tmin = d.temperature_2m_min?.[i];

    if (isStormCode(code)) {
      alerts.push({ id: `storm-${date}`, type: 'storm', severity: code === 95 ? 'warning' : 'danger', date, code, kind: 'code' });
    }
    if (rain >= 20) {
      alerts.push({ id: `rain-${date}`, type: 'heavyRain', severity: rain >= 50 ? 'danger' : 'warning', date, value: rain, kind: 'mm' });
    }
    if (snow >= 5) {
      alerts.push({ id: `snow-${date}`, type: 'snow', severity: snow >= 15 ? 'danger' : 'warning', date, value: snow, kind: 'cm' });
    }
    if (gusts >= 60) {
      alerts.push({ id: `wind-${date}`, type: 'strongWind', severity: gusts >= 90 ? 'danger' : 'warning', date, value: gusts, kind: 'wind' });
    }
    if (tmax != null && tmax >= 35) {
      alerts.push({ id: `heat-${date}`, type: 'heat', severity: tmax >= 40 ? 'danger' : 'warning', date, value: tmax, kind: 'temp' });
    }
    if (tmin != null && tmin <= -20) {
      alerts.push({ id: `cold-${date}`, type: 'cold', severity: tmin <= -30 ? 'danger' : 'warning', date, value: tmin, kind: 'temp' });
    }
  }
  const rank = { danger: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => a.date.localeCompare(b.date) || rank[a.severity] - rank[b.severity]);
}

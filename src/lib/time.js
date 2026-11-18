/**
 * Open-Meteo returns local wall-clock times (timezone=auto) without an offset,
 * e.g. "2026-11-18T14:00". We format them as UTC so the displayed time is the
 * location's local time regardless of the viewer's own time zone.
 */
function toDate(iso) {
  if (!iso) return null;
  const s = iso.length <= 10 ? `${iso}T00:00` : iso;
  return new Date(`${s.slice(0, 16)}Z`);
}

export function formatTime(iso, locale) {
  const d = toDate(iso);
  if (!d) return '—';
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(d);
}

export function formatHour(iso, locale) {
  return formatTime(iso, locale);
}

export function formatWeekday(iso, locale, style = 'short') {
  const d = toDate(iso);
  if (!d) return '—';
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(d);
}

export function formatDate(iso, locale, opts = { day: 'numeric', month: 'short' }) {
  const d = toDate(iso);
  if (!d) return '—';
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(d);
}

export function formatFullDate(iso, locale) {
  return formatDate(iso, locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

export const capitalize = (s) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

/** Index of the hourly slot matching the current local hour. */
export function currentHourIndex(hourlyTimes, currentIso) {
  if (!hourlyTimes?.length || !currentIso) return 0;
  const key = currentIso.slice(0, 13);
  const idx = hourlyTimes.findIndex((t) => t.slice(0, 13) === key);
  return idx === -1 ? 0 : idx;
}

/** ISO date (YYYY-MM-DD) shifted by n days. */
export function shiftDate(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

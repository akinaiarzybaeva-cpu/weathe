/**
 * Diverging temperature scale centred on 0 °C (freezing):
 * cold = blue, neutral grey at 0 °C, warm = orange/red.
 */
const STOPS = [
  { t: -25, c: [42, 76, 170] },
  { t: -12, c: [57, 135, 229] },
  { t: 0, c: [150, 158, 175] },
  { t: 12, c: [237, 161, 0] },
  { t: 25, c: [235, 104, 52] },
  { t: 38, c: [200, 40, 50] },
];

export function tempColor(celsius) {
  if (celsius == null) return 'rgb(140,148,165)';
  if (celsius <= STOPS[0].t) return `rgb(${STOPS[0].c.join(',')})`;
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    if (celsius <= b.t) {
      const k = (celsius - a.t) / (b.t - a.t);
      const c = a.c.map((v, j) => Math.round(v + (b.c[j] - v) * k));
      return `rgb(${c.join(',')})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1].c.join(',')})`;
}

export const TEMP_LEGEND = [-20, -10, 0, 10, 20, 30];

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/**
 * WMO weather interpretation codes (used by Open-Meteo) mapped to an icon
 * family and an animated background scene.
 */
const GROUPS = [
  { codes: [0], icon: 'clear', scene: 'clear' },
  { codes: [1], icon: 'mostlyClear', scene: 'clear' },
  { codes: [2], icon: 'partly', scene: 'partly' },
  { codes: [3], icon: 'overcast', scene: 'cloudy' },
  { codes: [45, 48], icon: 'fog', scene: 'fog' },
  { codes: [51, 53, 55, 56, 57], icon: 'drizzle', scene: 'rain' },
  { codes: [61, 63, 66, 80, 81], icon: 'rain', scene: 'rain' },
  { codes: [65, 67, 82], icon: 'heavyRain', scene: 'rain' },
  { codes: [71, 73, 77, 85], icon: 'snow', scene: 'snow' },
  { codes: [75, 86], icon: 'heavySnow', scene: 'snow' },
  { codes: [95], icon: 'storm', scene: 'storm' },
  { codes: [96, 99], icon: 'hail', scene: 'storm' },
];

const BY_CODE = new Map();
for (const g of GROUPS) for (const c of g.codes) BY_CODE.set(c, g);

export function weatherMeta(code) {
  return BY_CODE.get(code) ?? { icon: 'overcast', scene: 'cloudy' };
}

export function sceneFor(code, isDay = true) {
  const { scene } = weatherMeta(code);
  if (!isDay && (scene === 'clear' || scene === 'partly')) return `${scene}-night`;
  return scene;
}

export const isStormCode = (code) => code === 95 || code === 96 || code === 99;

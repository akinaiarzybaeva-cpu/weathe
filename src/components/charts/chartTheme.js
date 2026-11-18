import { useSettings } from '../../context/SettingsContext.jsx';

/**
 * Chart colours from the validated reference palette (categorical slots
 * 1–3 pass CVD checks in both modes). Text/grid use neutral ink tokens.
 */
const LIGHT = {
  s1: '#2a78d6', // blue – primary measure (temperature, AQI)
  s2: '#eb6834', // orange – secondary measure (feels like, max)
  s3: '#1baf7a', // aqua – tertiary (humidity, wind)
  text: '#52514e',
  muted: '#8a8f9c',
  grid: 'rgba(15, 23, 42, 0.07)',
  surface: '#ffffff',
  cursor: 'rgba(15, 23, 42, 0.18)',
};

const DARK = {
  s1: '#3987e5',
  s2: '#d95926',
  s3: '#199e70',
  text: '#c3c2b7',
  muted: '#8d97ad',
  grid: 'rgba(255, 255, 255, 0.06)',
  surface: '#171b24',
  cursor: 'rgba(255, 255, 255, 0.25)',
};

export function useChartTheme() {
  const { isDark } = useSettings();
  return isDark ? DARK : LIGHT;
}

export const axisProps = (c) => ({
  tick: { fill: c.muted, fontSize: 11, fontWeight: 600 },
  axisLine: false,
  tickLine: false,
});

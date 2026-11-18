import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Cloudy,
  Moon,
  Snowflake,
  Sun,
} from 'lucide-react';
import { weatherMeta } from '../../lib/weatherCodes.js';

const ICONS = {
  clear: { day: Sun, night: Moon, color: 'text-amber-400', nightColor: 'text-indigo-300' },
  mostlyClear: { day: CloudSun, night: CloudMoon, color: 'text-amber-400', nightColor: 'text-indigo-300' },
  partly: { day: CloudSun, night: CloudMoon, color: 'text-amber-300', nightColor: 'text-indigo-300' },
  overcast: { day: Cloudy, color: 'text-slate-400' },
  fog: { day: CloudFog, color: 'text-slate-400' },
  drizzle: { day: CloudDrizzle, color: 'text-sky-400' },
  rain: { day: CloudRain, color: 'text-sky-400' },
  heavyRain: { day: CloudRainWind, color: 'text-blue-500' },
  snow: { day: CloudSnow, color: 'text-cyan-300' },
  heavySnow: { day: Snowflake, color: 'text-cyan-300' },
  storm: { day: CloudLightning, color: 'text-violet-400' },
  hail: { day: CloudHail, color: 'text-violet-400' },
};

/** Weather icon for a WMO code. `isDay` switches sun/moon variants. */
export default function WeatherIcon({ code, isDay = true, className = 'h-8 w-8', title, colorClass }) {
  const { icon } = weatherMeta(code);
  const spec = ICONS[icon] || { day: Cloud, color: 'text-slate-400' };
  const Icon = !isDay && spec.night ? spec.night : spec.day;
  const color = colorClass || (!isDay && spec.nightColor ? spec.nightColor : spec.color);
  return (
    <Icon
      className={`${color} drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)] ${className}`}
      strokeWidth={1.6}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    />
  );
}

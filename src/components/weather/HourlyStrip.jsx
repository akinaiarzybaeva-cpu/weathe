import { Droplet, Navigation2 } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';
import WeatherIcon from './WeatherIcon.jsx';

/** Horizontally scrollable 24-hour strip (swipeable on mobile). */
export default function HourlyStrip({ hours, highlightFirst = true }) {
  const { t } = useI18n();
  const f = useFormat();

  return (
    <div className="scroll-x" role="list">
      {hours.map((h, i) => {
        const now = highlightFirst && i === 0;
        return (
          <div
            key={h.time}
            role="listitem"
            className={`flex w-[84px] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition ${
              now ? 'bg-brand-500 text-white shadow-glow' : 'bg-black/[0.035] dark:bg-white/[0.04]'
            }`}
          >
            <p className={`text-xs font-bold ${now ? '' : 'muted'}`}>{now ? t('common.now') : f.time(h.time)}</p>
            <WeatherIcon code={h.weather_code} isDay={h.is_day === 1} className="h-8 w-8" title={f.condition(h.weather_code)} />
            <p className="text-lg font-extrabold">{f.temp(h.temperature_2m)}</p>
            <p className={`flex items-center gap-0.5 text-[11px] font-bold ${now ? 'text-white/90' : 'text-sky-500 dark:text-sky-300'}`} title={t('common.rainChance')}>
              <Droplet className="h-3 w-3" /> {f.pct(h.precipitation_probability)}
            </p>
            <p className={`flex items-center gap-0.5 text-[11px] font-semibold ${now ? 'text-white/80' : 'muted'}`} title={t('common.wind')}>
              <Navigation2 className="h-3 w-3" style={{ transform: `rotate(${(h.wind_direction_10m + 180) % 360}deg)` }} />
              {f.windValue(h.wind_speed_10m)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

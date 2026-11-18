import { ArrowDown, ArrowUp, Clock, MapPin } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';
import WeatherIcon from './WeatherIcon.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import { Skeleton } from '../ui/States.jsx';

export function CurrentWeatherSkeleton() {
  return (
    <div className="card min-h-[300px] space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-20 w-48" />
      <Skeleton className="h-4 w-56" />
      <div className="grid grid-cols-3 gap-3 pt-6">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}

/** Hero card with the current conditions (light-blue "today" card from the design). */
export default function CurrentWeatherCard({ location, forecast }) {
  const { t } = useI18n();
  const f = useFormat();
  const c = forecast.current;
  const today = forecast.daily;
  const isDay = c.is_day === 1;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl p-6 text-slate-900 shadow-glass animate-fade-up sm:p-7 ${
        isDay ? 'bg-gradient-to-br from-[#d4e7fb] via-[#bcd9f5] to-[#a9c8f0]' : 'bg-gradient-to-br from-[#c7cdf6] via-[#aab5ee] to-[#8d9ae6]'
      }`}
      aria-label={f.placeName(location)}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/40 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{f.placeName(location)}</span>
          </p>
          <p className="truncate text-xs font-semibold text-slate-700">{f.placeSubtitle(location)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full bg-white/50 px-3 py-1 text-xs font-bold sm:inline-flex">
            <Clock className="h-3.5 w-3.5" /> {f.weekday(c.time, 'long')}, {f.time(c.time)}
          </span>
          <FavoriteButton location={location} className="icon-btn bg-white/50 text-slate-900 hover:bg-white/70" />
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-start">
            <span className="text-7xl font-extrabold leading-none tracking-tighter sm:text-8xl">{f.tempValue(c.temperature_2m)}</span>
            <span className="mt-2 text-2xl font-bold">{f.tempUnitLabel}</span>
          </div>
          <p className="mt-2 text-lg font-bold">{f.condition(c.weather_code)}</p>
          <p className="text-sm font-semibold text-slate-700">
            {t('common.feelsLike')} {f.temp(c.apparent_temperature)}
          </p>
        </div>
        <WeatherIcon
          code={c.weather_code}
          isDay={isDay}
          className="h-28 w-28 animate-float sm:h-36 sm:w-36"
          colorClass={isDay ? undefined : 'text-indigo-900/80'}
          title={f.condition(c.weather_code)}
        />
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-800">
        <span className="inline-flex items-center gap-1">
          <ArrowUp className="h-4 w-4" /> {f.temp(today.temperature_2m_max[0])}
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowDown className="h-4 w-4" /> {f.temp(today.temperature_2m_min[0])}
        </span>
        <span>
          {t('common.humidity')}: {f.pct(c.relative_humidity_2m)}
        </span>
        <span>
          {t('common.wind')}: {f.wind(c.wind_speed_10m)} {f.direction(c.wind_direction_10m)}
        </span>
        <span className="text-xs text-slate-700 sm:ml-auto">{t('common.updated', { time: f.time(c.time) })}</span>
      </div>
    </section>
  );
}

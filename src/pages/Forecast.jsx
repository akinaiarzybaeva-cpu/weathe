import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, CloudRain, Droplet, Navigation2, Snowflake, Sun, Sunrise, Sunset, Thermometer, Timer, Wind } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useWeather } from '../context/WeatherContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { dailyRows, hoursForDate, nextHours } from '../lib/forecast.js';
import { uvLevel } from '../lib/units.js';
import HourlyStrip from '../components/weather/HourlyStrip.jsx';
import WeatherIcon from '../components/weather/WeatherIcon.jsx';
import HourlyTempChart from '../components/charts/HourlyTempChart.jsx';
import RainChanceChart from '../components/charts/RainChanceChart.jsx';
import { ErrorState, PageHeader, SectionHeader, Skeleton } from '../components/ui/States.jsx';

function TempRange({ min, max, weekMin, weekMax }) {
  const span = Math.max(1, weekMax - weekMin);
  const left = ((min - weekMin) / span) * 100;
  const width = Math.max(4, ((max - min) / span) * 100);
  return (
    <div className="relative h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10" aria-hidden="true">
      <div className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400" style={{ left: `${left}%`, width: `${width}%` }} />
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat-tile">
      <div className="flex items-center gap-2">
        <Icon className="muted h-4 w-4" />
        <p className="eyebrow">{label}</p>
      </div>
      <p className="mt-2 text-lg font-extrabold">{value}</p>
      {sub && <p className="muted text-xs font-semibold">{sub}</p>}
    </div>
  );
}

function DayDetails({ day, forecast }) {
  const { t } = useI18n();
  const f = useFormat();
  const hours = hoursForDate(forecast, day.time);
  const uvl = uvLevel(day.uv_index_max);

  return (
    <div className="mt-3 space-y-5 rounded-3xl bg-black/[0.025] p-4 animate-fade-up dark:bg-white/[0.03] sm:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric icon={Thermometer} label={t('common.feelsLike')} value={`${f.temp(day.apparent_temperature_max)} / ${f.temp(day.apparent_temperature_min)}`} />
        <Metric icon={CloudRain} label={t('forecast.precipitationSum')} value={f.mm(day.precipitation_sum)} sub={`${t('common.rainChance')}: ${f.pct(day.precipitation_probability_max)}`} />
        <Metric icon={Snowflake} label={t('forecast.snowfall')} value={f.cm(day.snowfall_sum)} />
        <Metric icon={Timer} label={t('forecast.precipHours')} value={f.num(day.precipitation_hours)} />
        <Metric
          icon={Wind}
          label={t('forecast.maxWind')}
          value={f.wind(day.wind_speed_10m_max)}
          sub={`${t('common.direction')}: ${f.direction(day.wind_direction_10m_dominant)}`}
        />
        <Metric icon={Wind} label={t('forecast.maxGusts')} value={f.wind(day.wind_gusts_10m_max)} />
        <Metric icon={Sun} label={t('forecast.uvMax')} value={f.num(day.uv_index_max, 1)} sub={uvl ? t(`uv.${uvl}`) : null} />
        <Metric icon={Sunrise} label={`${t('common.sunrise')} / ${t('common.sunset')}`} value={`${f.time(day.sunrise)} – ${f.time(day.sunset)}`} sub={f.duration(day.daylight_duration)} />
      </div>
      {hours.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-bold">{t('forecast.hourlyForDay', { day: f.weekday(day.time, 'long') })}</p>
          <HourlyStrip hours={hours.filter((_, i) => i % 2 === 0)} highlightFirst={false} />
          <div className="mt-4">
            <HourlyTempChart hours={hours} height={200} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Forecast() {
  const { t } = useI18n();
  const f = useFormat();
  const { location, forecast } = useWeather();
  const [params, setParams] = useSearchParams();
  const data = forecast.data;
  const selected = params.get('day');
  const selectedRef = useRef(null);

  const days = useMemo(() => (data ? dailyRows(data).slice(0, 8) : []), [data]);
  const hours = useMemo(() => (data ? nextHours(data, 24) : []), [data]);
  const weekMin = Math.min(...days.map((d) => d.temperature_2m_min ?? 0));
  const weekMax = Math.max(...days.map((d) => d.temperature_2m_max ?? 0));

  useEffect(() => {
    if (selected && selectedRef.current) selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selected, data]);

  const toggleDay = (time) => {
    const next = new URLSearchParams(params);
    if (selected === time) next.delete('day');
    else next.set('day', time);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <PageHeader title={t('forecast.title')} subtitle={t('forecast.subtitle', { place: f.placeName(location) })} />

      {forecast.error ? (
        <div className="card">
          <ErrorState error={forecast.error} onRetry={forecast.reload} />
        </div>
      ) : !data ? (
        <div className="space-y-5">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-5">
          <section className="card">
            <SectionHeader title={t('forecast.hourlyTitle')} />
            <HourlyStrip hours={hours} />
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-bold">{t('forecast.tempChart')}</p>
                <HourlyTempChart hours={hours} />
              </div>
              <div>
                <p className="mb-2 text-sm font-bold">{t('common.rainChance')}</p>
                <RainChanceChart hours={hours} height={244} />
              </div>
            </div>
          </section>

          <section className="card">
            <SectionHeader title={t('forecast.weeklyTitle')} subtitle={t('forecast.selectDay')} />
            <ul className="space-y-2">
              {days.map((d) => {
                const open = selected === d.time;
                return (
                  <li key={d.time} ref={open ? selectedRef : null}>
                    <button
                      type="button"
                      onClick={() => toggleDay(d.time)}
                      aria-expanded={open}
                      className={`grid w-full grid-cols-[72px_40px_1fr_auto] items-center gap-3 rounded-2xl p-3 text-left transition sm:grid-cols-[110px_44px_minmax(120px,1.4fr)_minmax(140px,2fr)_auto_auto_auto] sm:gap-4 ${
                        open ? 'bg-brand-500/10 ring-1 ring-brand-500/40' : 'bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.035] dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-bold">{f.dayName(d.time, data.current.time)}</span>
                        <span className="muted block text-xs">{f.date(d.time)}</span>
                      </span>
                      <WeatherIcon code={d.weather_code} className="h-9 w-9" title={f.condition(d.weather_code)} />
                      <span className="hidden truncate text-sm font-semibold sm:block">{f.condition(d.weather_code)}</span>
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <span className="muted w-9 text-right">{f.temp(d.temperature_2m_min)}</span>
                        <TempRange min={d.temperature_2m_min} max={d.temperature_2m_max} weekMin={weekMin} weekMax={weekMax} />
                        <span className="w-9">{f.temp(d.temperature_2m_max)}</span>
                      </span>
                      <span className="hidden items-center gap-1 text-xs font-bold text-sky-500 dark:text-sky-300 sm:flex" title={t('common.rainChance')}>
                        <Droplet className="h-3.5 w-3.5" /> {f.pct(d.precipitation_probability_max)}
                      </span>
                      <span className="muted hidden items-center gap-1 text-xs font-semibold sm:flex" title={t('common.wind')}>
                        <Navigation2 className="h-3.5 w-3.5" style={{ transform: `rotate(${((d.wind_direction_10m_dominant ?? 0) + 180) % 360}deg)` }} />
                        {f.wind(d.wind_speed_10m_max)}
                      </span>
                      <ChevronDown className={`muted hidden h-4 w-4 transition sm:block ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <DayDetails day={d} forecast={data} />}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

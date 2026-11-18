import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, GitCompare, LayoutDashboard, Plus, Star, Trash2 } from 'lucide-react';
import { useI18n, useSettings } from '../context/SettingsContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useSelectedLocation } from '../context/LocationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useFavoritesWeather } from '../hooks/useFavoritesWeather.js';
import { axisProps, useChartTheme } from '../components/charts/chartTheme.js';
import ChartTooltip from '../components/charts/ChartTooltip.jsx';
import WeatherIcon from '../components/weather/WeatherIcon.jsx';
import CitySearch from '../components/weather/CitySearch.jsx';
import { EmptyState, ErrorState, PageHeader, SectionHeader, Skeleton } from '../components/ui/States.jsx';

// Categorical slots 1–4 of the reference palette (fixed order, never cycled).
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500'],
};
const MAX_COMPARE = 4;

function CompareView({ items, weather }) {
  const { t } = useI18n();
  const f = useFormat();
  const c = useChartTheme();
  const { isDark } = useSettings();
  const colors = isDark ? SERIES.dark : SERIES.light;

  const rows = [
    { label: t('common.temperature'), get: (w) => f.temp(w.current.temperature_2m) },
    { label: t('common.feelsLike'), get: (w) => f.temp(w.current.apparent_temperature) },
    { label: t('common.max'), get: (w) => f.temp(w.daily.temperature_2m_max[0]) },
    { label: t('common.min'), get: (w) => f.temp(w.daily.temperature_2m_min[0]) },
    { label: t('common.humidity'), get: (w) => f.pct(w.current.relative_humidity_2m) },
    { label: t('common.wind'), get: (w) => `${f.wind(w.current.wind_speed_10m)} ${f.direction(w.current.wind_direction_10m)}` },
    { label: t('common.pressure'), get: (w) => f.pressure(w.current.pressure_msl) },
    { label: t('common.cloudCover'), get: (w) => f.pct(w.current.cloud_cover) },
    { label: t('common.rainChance'), get: (w) => f.pct(w.daily.precipitation_probability_max[0]) },
  ];

  const chart = useMemo(() => {
    const base = weather[items[0].id]?.daily?.time || [];
    return base.map((time, i) => {
      const row = { time };
      items.forEach((it, k) => {
        row[`c${k}`] = f.tempValue(weather[it.id]?.daily?.temperature_2m_max?.[i]);
      });
      return row;
    });
  }, [items, weather, f]);

  return (
    <section className="card animate-fade-up">
      <SectionHeader title={t('favorites.compareTitle')} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr>
              <th className="muted py-2 pr-3 text-left text-xs font-bold">{t('favorites.metric')}</th>
              {items.map((it, k) => (
                <th key={it.id} className="py-2 pr-3 text-left">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[k] }} />
                    {f.placeName(it)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-black/5 dark:border-white/5">
              <td className="muted py-2 pr-3 text-xs font-semibold" />
              {items.map((it) => {
                const w = weather[it.id];
                return (
                  <td key={it.id} className="py-2 pr-3">
                    {w && (
                      <span className="flex items-center gap-2">
                        <WeatherIcon code={w.current.weather_code} isDay={w.current.is_day === 1} className="h-6 w-6" />
                        <span className="text-xs font-semibold">{f.condition(w.current.weather_code)}</span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-black/5 dark:border-white/5">
                <td className="muted py-2 pr-3 text-xs font-semibold">{r.label}</td>
                {items.map((it) => (
                  <td key={it.id} className="py-2 pr-3 font-bold tabular-nums">
                    {weather[it.id] ? r.get(weather[it.id]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-2 mt-6 text-sm font-bold">{t('favorites.tempChart')}</p>
      <div className="mb-2 flex flex-wrap gap-4 text-xs font-semibold">
        {items.map((it, k) => (
          <span key={it.id} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: colors[k] }} /> {f.placeName(it)}
          </span>
        ))}
      </div>
      <div className="h-64" role="img" aria-label={t('favorites.tempChart')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="time" tickFormatter={(v) => f.weekday(v)} {...axisProps(c)} />
            <YAxis {...axisProps(c)} width={44} tickFormatter={(v) => `${v}°`} />
            <Tooltip
              cursor={{ stroke: c.cursor }}
              content={
                <ChartTooltip
                  labelFormat={(v) => f.date(v, { weekday: 'short', day: 'numeric', month: 'short' })}
                  rows={items.map((it, k) => ({ key: `c${k}`, label: f.placeName(it), color: colors[k], format: (v) => `${v}${f.tempUnitLabel}` }))}
                />
              }
            />
            {items.map((it, k) => (
              <Line key={it.id} type="monotone" dataKey={`c${k}`} stroke={colors[k]} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: colors[k] }} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Favorites() {
  const { t } = useI18n();
  const f = useFormat();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { favorites, remove, add, isFavorite } = useFavorites();
  const { location, setLocation } = useSelectedLocation();
  const weather = useFavoritesWeather();
  const [compare, setCompare] = useState([]);

  const compareItems = favorites.filter((fav) => compare.includes(fav.id));

  const toggleCompare = (id) => {
    setCompare((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length >= MAX_COMPARE) {
        notify(t('favorites.compareLimit'), 'error');
        return list;
      }
      return [...list, id];
    });
  };

  return (
    <div>
      <PageHeader
        title={t('favorites.title')}
        subtitle={t('favorites.subtitle')}
        actions={
          !isFavorite(location) && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                add(location);
                notify(t('favorites.added', { city: f.placeName(location) }), 'success');
              }}
            >
              <Plus className="h-4 w-4" /> {t('favorites.addCurrent')}
            </button>
          )
        }
      />

      {favorites.length === 0 ? (
        <div className="card">
          <EmptyState icon={Star} title={t('favorites.empty')} hint={t('favorites.emptyHint')} action={<CitySearch className="mt-2 w-full max-w-sm text-left" />} />
        </div>
      ) : (
        <div className="space-y-5">
          {weather.error && (
            <div className="card">
              <ErrorState error={weather.error} onRetry={weather.reload} compact />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="muted flex items-center gap-2 text-sm font-semibold">
              <GitCompare className="h-4 w-4" /> {t('favorites.compareHint')}
            </p>
            {compare.length > 0 && (
              <button type="button" className="btn-soft" onClick={() => setCompare([])}>
                {t('favorites.clearCompare')}
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((fav) => {
              const w = weather.data?.[fav.id];
              const selected = compare.includes(fav.id);
              return (
                <article key={fav.id} className={`card flex flex-col gap-4 transition ${selected ? 'ring-2 ring-brand-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold">{f.placeName(fav)}</p>
                      <p className="muted truncate text-xs font-semibold">{f.placeSubtitle(fav)}</p>
                    </div>
                    <button
                      type="button"
                      className="icon-btn text-rose-500"
                      onClick={() => {
                        remove(fav);
                        setCompare((l) => l.filter((x) => x !== fav.id));
                        notify(t('favorites.removed', { city: f.placeName(fav) }));
                      }}
                      aria-label={t('favorites.remove')}
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {w ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-extrabold tracking-tight">{f.temp(w.current.temperature_2m)}</p>
                        <p className="text-sm font-semibold">{f.condition(w.current.weather_code)}</p>
                        <p className="muted text-xs">
                          {t('common.max')} {f.temp(w.daily.temperature_2m_max[0])} · {t('common.min')} {f.temp(w.daily.temperature_2m_min[0])}
                        </p>
                      </div>
                      <WeatherIcon code={w.current.weather_code} isDay={w.current.is_day === 1} className="h-16 w-16" />
                    </div>
                  ) : (
                    !weather.error && <Skeleton className="h-20" />
                  )}

                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      className="btn-soft flex-1"
                      onClick={() => {
                        setLocation(fav);
                        navigate('/');
                      }}
                    >
                      <LayoutDashboard className="h-4 w-4" /> {t('favorites.open')}
                    </button>
                    <button type="button" aria-pressed={selected} className={selected ? 'btn-primary' : 'btn-soft'} onClick={() => toggleCompare(fav.id)}>
                      {selected ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />} {t('favorites.compare')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {compareItems.length >= 2 && weather.data && <CompareView items={compareItems} weather={weather.data} />}
        </div>
      )}
    </div>
  );
}

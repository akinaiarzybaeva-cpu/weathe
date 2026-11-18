import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { CloudRain, Droplets, Snowflake, ThermometerSun, TrendingDown, TrendingUp, Wind } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useWeather } from '../context/WeatherContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useAsync } from '../hooks/useAsync.js';
import { getHistory, getRecentDaily } from '../services/api.js';
import { shiftDate } from '../lib/time.js';
import { axisProps, useChartTheme } from '../components/charts/chartTheme.js';
import ChartTooltip from '../components/charts/ChartTooltip.jsx';
import { ErrorState, PageHeader, Segmented, SectionHeader, Skeleton } from '../components/ui/States.jsx';

const mean = (arr) => {
  const v = arr.filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const sum = (arr) => arr.filter((x) => x != null).reduce((a, b) => a + b, 0);

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className="muted h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="muted mt-0.5 text-xs font-semibold">{sub}</p>}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="mb-2 flex flex-wrap gap-4 text-xs font-semibold">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: i.color }} /> {i.label}
        </span>
      ))}
    </div>
  );
}

function ChartCard({ title, children, legend }) {
  return (
    <section className="card">
      <SectionHeader title={title} />
      {legend}
      <div className="h-64" role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** Week-over-week comparison: previous week, past 7 days, next 7 days. */
function WeeklyChange({ location }) {
  const { t } = useI18n();
  const f = useFormat();
  const c = useChartTheme();
  const key = `${location.latitude},${location.longitude}`;
  const recent = useAsync(() => getRecentDaily(location, 14), [key]);

  const weeks = useMemo(() => {
    const d = recent.data?.daily;
    if (!d?.time) return null;
    const slice = (from, to) => ({
      start: d.time[from],
      mean: mean(d.temperature_2m_mean.slice(from, to)),
      max: mean(d.temperature_2m_max.slice(from, to)),
      min: mean(d.temperature_2m_min.slice(from, to)),
      precip: sum(d.precipitation_sum.slice(from, to)),
    });
    // past_days=14 → indices 0..13 are the past, 14 is today, 15..20 next days.
    return [
      { label: t('analytics.lastWeek'), ...slice(0, 7) },
      { label: t('analytics.thisWeek'), ...slice(7, 14) },
      { label: t('analytics.nextWeek'), ...slice(14, 21) },
    ];
  }, [recent.data, t]);

  if (recent.error) return <section className="card"><ErrorState error={recent.error} onRetry={recent.reload} messageKey="errors.history" compact /></section>;
  if (!weeks) return <Skeleton className="h-80 rounded-3xl" />;

  const data = weeks.map((w) => ({ ...w, meanU: f.tempValue(w.mean), maxU: f.tempValue(w.max), minU: f.tempValue(w.min) }));
  const delta = weeks[1].mean != null && weeks[0].mean != null ? weeks[1].mean - weeks[0].mean : null;
  const deltaU = delta == null ? null : f.tempUnitLabel === '°F' ? delta * 1.8 : delta;

  return (
    <section className="card">
      <SectionHeader
        title={t('analytics.weeklyChange')}
        action={
          deltaU != null && (
            <span className={`chip ${deltaU >= 0 ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300' : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'}`}>
              {deltaU >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {deltaU >= 0 ? '+' : ''}
              {f.num(deltaU, 1)}° {t('analytics.vsPrevious')}
            </span>
          )
        }
      />
      <Legend
        items={[
          { label: t('analytics.minTemp'), color: c.s1 },
          { label: t('analytics.meanTemp'), color: c.s3 },
          { label: t('analytics.maxTemp'), color: c.s2 },
        ]}
      />
      <div className="h-64" role="img" aria-label={t('analytics.weeklyChange')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="label" {...axisProps(c)} />
            <YAxis {...axisProps(c)} width={44} tickFormatter={(v) => `${v}°`} />
            <Tooltip
              cursor={{ fill: c.grid }}
              content={
                <ChartTooltip
                  labelFormat={(label, d) => `${label} · ${t('analytics.weekLabel', { date: f.date(d.start) })}`}
                  rows={[
                    { key: 'minU', label: t('analytics.minTemp'), color: c.s1, format: (v) => `${v}${f.tempUnitLabel}` },
                    { key: 'meanU', label: t('analytics.meanTemp'), color: c.s3, format: (v) => `${v}${f.tempUnitLabel}` },
                    { key: 'maxU', label: t('analytics.maxTemp'), color: c.s2, format: (v) => `${v}${f.tempUnitLabel}` },
                    { key: 'precip', label: t('analytics.totalPrecip'), color: '#8a93a6', format: (v) => f.mm(v) },
                  ]}
                />
              }
            />
            <Bar dataKey="minU" fill={c.s1} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="meanU" fill={c.s3} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="maxU" fill={c.s2} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Analytics() {
  const { t } = useI18n();
  const f = useFormat();
  const c = useChartTheme();
  const { location, forecast } = useWeather();
  const [period, setPeriod] = useState(30);

  // Use the location's local date when available.
  const today = forecast.data?.current?.time?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const end = shiftDate(today, -1);
  const start = shiftDate(end, -(period - 1));
  const key = `${location.latitude},${location.longitude},${start},${end}`;
  const history = useAsync(() => getHistory(location, start, end), [key], { enabled: Boolean(forecast.data) });

  const rows = useMemo(() => {
    const d = history.data?.daily;
    if (!d?.time) return [];
    return d.time
      .map((time, i) => ({
        time,
        max: d.temperature_2m_max[i],
        min: d.temperature_2m_min[i],
        mean: d.temperature_2m_mean[i],
        precip: d.precipitation_sum[i],
        snow: d.snowfall_sum[i],
        wind: d.wind_speed_10m_max[i],
        gusts: d.wind_gusts_10m_max[i],
        humidity: d.relative_humidity_2m_mean[i],
      }))
      .filter((r) => r.max != null);
  }, [history.data]);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const warm = rows.reduce((a, b) => (b.max > a.max ? b : a));
    const cold = rows.reduce((a, b) => (b.min < a.min ? b : a));
    const windy = rows.reduce((a, b) => ((b.wind ?? 0) > (a.wind ?? 0) ? b : a));
    return {
      avgTemp: mean(rows.map((r) => r.mean)),
      totalPrecip: sum(rows.map((r) => r.precip)),
      totalSnow: sum(rows.map((r) => r.snow)),
      rainyDays: rows.filter((r) => (r.precip ?? 0) >= 0.1).length,
      avgHumidity: mean(rows.map((r) => r.humidity)),
      warm,
      cold,
      windy,
    };
  }, [rows]);

  const chartRows = rows.map((r) => ({ ...r, maxU: f.tempValue(r.max), minU: f.tempValue(r.min), windU: f.windValue(r.wind) }));
  const xProps = { dataKey: 'time', tickFormatter: (v) => f.date(v), minTickGap: 28, ...axisProps(c) };
  const label = (v) => f.date(v, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div>
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle', { place: f.placeName(location) })}
        actions={
          <Segmented
            value={period}
            onChange={setPeriod}
            label={t('analytics.title')}
            options={[
              { value: 7, label: t('analytics.past7') },
              { value: 30, label: t('analytics.past30') },
              { value: 90, label: t('analytics.past90') },
            ]}
          />
        }
      />

      {history.error ? (
        <div className="card">
          <ErrorState error={history.error} onRetry={history.reload} messageKey="errors.history" />
        </div>
      ) : !stats ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icon={ThermometerSun} label={t('analytics.avgTemp')} value={f.temp(stats.avgTemp)} sub={`${t('analytics.warmest')}: ${f.temp(stats.warm.max)} · ${f.date(stats.warm.time)}`} />
            <Kpi icon={CloudRain} label={t('analytics.totalPrecip')} value={f.mm(stats.totalPrecip)} sub={`${t('analytics.rainyDays')}: ${stats.rainyDays}`} />
            <Kpi icon={Wind} label={t('analytics.maxWind')} value={f.wind(stats.windy.wind)} sub={f.date(stats.windy.time)} />
            <Kpi
              icon={stats.totalSnow > 0 ? Snowflake : Droplets}
              label={t('analytics.avgHumidity')}
              value={f.pct(stats.avgHumidity)}
              sub={`${t('analytics.coldest')}: ${f.temp(stats.cold.min)} · ${f.date(stats.cold.time)}`}
            />
          </div>

          <ChartCard
            title={t('analytics.tempTrend')}
            legend={
              <Legend
                items={[
                  { label: t('analytics.maxTemp'), color: c.s2 },
                  { label: t('analytics.minTemp'), color: c.s1 },
                ]}
              />
            }
          >
            <LineChart data={chartRows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis {...xProps} />
              <YAxis {...axisProps(c)} width={44} tickFormatter={(v) => `${v}°`} />
              <Tooltip
                cursor={{ stroke: c.cursor }}
                content={
                  <ChartTooltip
                    labelFormat={label}
                    rows={[
                      { key: 'maxU', label: t('analytics.maxTemp'), color: c.s2, format: (v) => `${v}${f.tempUnitLabel}` },
                      { key: 'minU', label: t('analytics.minTemp'), color: c.s1, format: (v) => `${v}${f.tempUnitLabel}` },
                    ]}
                  />
                }
              />
              <Line type="monotone" dataKey="maxU" stroke={c.s2} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} />
              <Line type="monotone" dataKey="minU" stroke={c.s1} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} />
            </LineChart>
          </ChartCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <WeeklyChange location={location} />
            <ChartCard title={t('analytics.precipStats')}>
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis {...xProps} />
                <YAxis {...axisProps(c)} width={44} />
                <Tooltip
                  cursor={{ fill: c.grid }}
                  content={
                    <ChartTooltip
                      labelFormat={label}
                      rows={[
                        { key: 'precip', label: t('common.precipitation'), color: c.s1, format: (v) => f.mm(v) },
                        { key: 'snow', label: t('forecast.snowfall'), color: '#8a93a6', format: (v) => f.cm(v) },
                      ]}
                    />
                  }
                />
                <Bar dataKey="precip" fill={c.s1} radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ChartCard>
            <ChartCard title={t('analytics.windChart')}>
              <LineChart data={chartRows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis {...xProps} />
                <YAxis {...axisProps(c)} width={44} />
                <Tooltip
                  cursor={{ stroke: c.cursor }}
                  content={
                    <ChartTooltip
                      labelFormat={label}
                      rows={[
                        { key: 'wind', label: t('forecast.maxWind'), color: c.s3, format: (v) => f.wind(v) },
                        { key: 'gusts', label: t('forecast.maxGusts'), color: '#8a93a6', format: (v) => f.wind(v) },
                      ]}
                    />
                  }
                />
                <Line type="monotone" dataKey="windU" stroke={c.s3} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} />
              </LineChart>
            </ChartCard>
            <ChartCard title={t('analytics.humidityChart')}>
              <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="humFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.s1} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={c.s1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis {...xProps} />
                <YAxis {...axisProps(c)} width={44} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  cursor={{ stroke: c.cursor }}
                  content={<ChartTooltip labelFormat={label} rows={[{ key: 'humidity', label: t('common.humidity'), color: c.s1, format: (v) => f.pct(v) }]} />}
                />
                <Area type="monotone" dataKey="humidity" stroke={c.s1} strokeWidth={2} fill="url(#humFill)" dot={false} activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} />
              </AreaChart>
            </ChartCard>
          </div>
          <p className="muted text-xs">{t('analytics.historyNote')}</p>
        </div>
      )}
    </div>
  );
}

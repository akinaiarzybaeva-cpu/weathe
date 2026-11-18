import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HeartPulse, ShieldCheck } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useWeather } from '../context/WeatherContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { AQI_LEVELS, POLLUTANTS, WHO_GUIDELINE, aqiLevel, dominantPollutant } from '../lib/aqi.js';
import { currentHourIndex } from '../lib/time.js';
import { axisProps, useChartTheme } from '../components/charts/chartTheme.js';
import ChartTooltip from '../components/charts/ChartTooltip.jsx';
import { ErrorState, PageHeader, SectionHeader, Skeleton } from '../components/ui/States.jsx';

/** Semicircle gauge of the US AQI scale (0–300+), one arc per EPA category. */
function AqiGauge({ value }) {
  const max = 300;
  const toAngle = (v) => Math.PI * (1 - Math.min(v, max) / max);
  const pt = (v, r) => [100 + r * Math.cos(toAngle(v)), 100 - r * Math.sin(toAngle(v))];
  const bounds = [0, 50, 100, 150, 200, 300];
  const lvl = aqiLevel(value);
  const [nx, ny] = pt(value ?? 0, 70);

  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[280px]" role="img" aria-label={`AQI ${value ?? '—'}`}>
      {bounds.slice(0, -1).map((b, i) => {
        const [x1, y1] = pt(b + (i ? 1.5 : 0), 84);
        const [x2, y2] = pt(bounds[i + 1] - 1.5, 84);
        return <path key={b} d={`M${x1} ${y1} A84 84 0 0 1 ${x2} ${y2}`} fill="none" stroke={AQI_LEVELS[i].color} strokeWidth="14" strokeLinecap="round" opacity={lvl.index === i ? 1 : 0.35} />;
      })}
      {value != null && (
        <>
          <line x1="100" y1="100" x2={nx} y2={ny} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function PollutantCard({ name, value, subIndex, t, f }) {
  const guideline = WHO_GUIDELINE[name];
  const ratio = value != null ? value / guideline : 0;
  const lvl = aqiLevel(subIndex);
  return (
    <div className="stat-tile">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold">{t(`air.names.${name}`)}</p>
          <p className="muted text-xs font-semibold">{t(`air.long.${name}`)}</p>
        </div>
        <span className="chip text-white" style={{ background: lvl.color }}>
          {subIndex != null ? f.num(subIndex) : '—'}
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold">
        {f.num(value, 1)} <span className="muted text-xs font-semibold">{t('air.unit')}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10" title={`WHO: ${guideline} ${t('air.unit')}`}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 50)}%`, background: lvl.color }} />
      </div>
      <p className="muted mt-1 text-[11px] font-semibold">WHO {f.num(guideline)} {t('air.unit')}</p>
    </div>
  );
}

export default function AirQuality() {
  const { t } = useI18n();
  const f = useFormat();
  const c = useChartTheme();
  const { location, air } = useWeather();
  const data = air.data;
  const cur = data?.current;
  const lvl = aqiLevel(cur?.us_aqi);
  const dominant = dominantPollutant(cur);

  const trend = useMemo(() => {
    const h = data?.hourly;
    if (!h?.time) return [];
    const start = currentHourIndex(h.time, cur?.time);
    return h.time.slice(start, start + 24).map((time, i) => ({ time, aqi: h.us_aqi[start + i], pm25: h.pm2_5[start + i] }));
  }, [data, cur]);

  return (
    <div>
      <PageHeader title={t('air.title')} subtitle={t('air.subtitle', { place: f.placeName(location) })} />
      {air.error ? (
        <div className="card">
          <ErrorState error={air.error} onRetry={air.reload} messageKey="errors.air" />
        </div>
      ) : !data ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <section className="card flex flex-col items-center text-center animate-fade-up">
              <p className="eyebrow self-start">{t('air.usAqi')}</p>
              <AqiGauge value={cur.us_aqi} />
              <p className="-mt-4 text-5xl font-extrabold tracking-tight">{cur.us_aqi != null ? f.num(cur.us_aqi) : '—'}</p>
              <span className="chip mt-3 text-white" style={{ background: lvl.color }}>
                {t(`aqiLevel.${lvl.key}`)}
              </span>
              <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
                <div className="stat-tile p-3">
                  <p className="eyebrow">{t('air.euAqi')}</p>
                  <p className="mt-1 text-xl font-extrabold">{f.num(cur.european_aqi)}</p>
                </div>
                <div className="stat-tile p-3">
                  <p className="eyebrow">{t('air.dominant')}</p>
                  <p className="mt-1 text-xl font-extrabold">{dominant ? t(`air.names.${dominant}`) : '—'}</p>
                </div>
              </div>
              <p className="muted mt-4 text-[11px]">
                {t('common.updated', { time: f.time(cur.time) })} · {t('air.source')}
              </p>
            </section>

            <section className="card animate-fade-up">
              <SectionHeader title={t('air.recommendations')} />
              {lvl.key === 'unknown' ? (
                <p className="muted text-sm">{t('empty.noData')}</p>
              ) : (
                <ul className="space-y-2.5">
                  {t(`air.advice.${lvl.key}`).map((line, i) => (
                    <li key={i} className="flex gap-3 rounded-2xl bg-black/[0.03] p-3 text-sm dark:bg-white/[0.04]">
                      {lvl.index <= 1 ? <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" /> : <HeartPulse className="h-5 w-5 shrink-0" style={{ color: lvl.color }} />}
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {AQI_LEVELS.map((l, i) => (
                  <span
                    key={l.key}
                    className={`chip border ${lvl.key === l.key ? 'text-white' : 'muted border-black/10 dark:border-white/10'}`}
                    style={lvl.key === l.key ? { background: l.color, borderColor: l.color } : undefined}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                    {i === 0 ? 0 : AQI_LEVELS[i - 1].max + 1}
                    {Number.isFinite(l.max) ? `–${l.max}` : '+'} · {t(`aqiLevel.${l.key}`)}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <section className="card">
            <SectionHeader title={t('air.pollutants')} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {POLLUTANTS.map((p) => (
                <PollutantCard key={p} name={p} value={cur[p]} subIndex={cur[`us_aqi_${p}`]} t={t} f={f} />
              ))}
            </div>
          </section>

          <section className="card">
            <SectionHeader title={t('air.trend')} />
            <div className="h-64" role="img" aria-label={t('air.trend')}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.s1} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={c.s1} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="time" tickFormatter={(v) => f.time(v)} minTickGap={24} {...axisProps(c)} />
                  <YAxis {...axisProps(c)} width={44} allowDecimals={false} />
                  <ReferenceLine y={50} stroke={AQI_LEVELS[0].color} strokeDasharray="4 4" />
                  <ReferenceLine y={100} stroke={AQI_LEVELS[1].color} strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ stroke: c.cursor }}
                    content={
                      <ChartTooltip
                        labelFormat={(v) => `${f.weekday(v)} ${f.time(v)}`}
                        rows={[
                          { key: 'aqi', label: t('air.usAqi'), color: c.s1, format: (v) => `${v} · ${t(`aqiLevel.${aqiLevel(v).key}`)}` },
                          { key: 'pm25', label: 'PM2.5', color: '#8a93a6', format: (v) => `${f.num(v, 1)} ${t('air.unit')}` },
                        ]}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="aqi" stroke={c.s1} strokeWidth={2} fill="url(#aqiFill)" dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

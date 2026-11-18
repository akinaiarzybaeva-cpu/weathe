import { Link } from 'react-router-dom';
import { Cloud, Droplets, Eye, Gauge, Leaf, Navigation2, Sun, Sunrise, Sunset, Thermometer, Wind } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';
import { uvLevel, visibilityLevel } from '../../lib/units.js';
import { aqiLevel } from '../../lib/aqi.js';
import { Skeleton } from '../ui/States.jsx';

function Tile({ icon: Icon, label, value, sub, children, to }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className="muted h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="muted mt-1 text-xs font-semibold">{sub}</p>}
      {children}
    </>
  );
  return to ? (
    <Link to={to} className="stat-tile block transition hover:ring-2 hover:ring-brand-500/30">
      {body}
    </Link>
  ) : (
    <div className="stat-tile">{body}</div>
  );
}

function Meter({ value, max, color = '#5c6ee8' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** Sun arc showing the current position between sunrise and sunset. */
function SunArc({ sunrise, sunset, now }) {
  const toMin = (iso) => (iso ? Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)) : null);
  const r = toMin(sunrise);
  const s = toMin(sunset);
  const n = toMin(now);
  const p = r != null && s != null && n != null ? Math.max(0, Math.min(1, (n - r) / (s - r))) : 0;
  const angle = Math.PI * (1 - p);
  const x = 50 + 40 * Math.cos(angle);
  const y = 50 - 40 * Math.sin(angle);
  return (
    <svg viewBox="0 0 100 56" className="mt-2 h-16 w-full" aria-hidden="true">
      <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeDasharray="3 3" />
      <path d={`M10 50 A40 40 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`} fill="none" stroke="#f5b843" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={x} cy={y} r="4.5" fill="#f5b843" />
    </svg>
  );
}

export function HighlightsSkeleton() {
  return (
    <div className="card">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function Highlights({ forecast, air }) {
  const { t } = useI18n();
  const f = useFormat();
  const c = forecast.current;
  const d = forecast.daily;
  const uv = c.uv_index;
  const uvl = uvLevel(uv);
  const vis = visibilityLevel(c.visibility);
  const aqi = air?.current?.us_aqi;
  const aq = aqiLevel(aqi);

  return (
    <section className="card animate-fade-up">
      <h2 className="card-title mb-4">{t('dashboard.highlights')}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Tile icon={Thermometer} label={t('common.feelsLike')} value={f.temp(c.apparent_temperature)} sub={`${t('common.dewPoint')}: ${f.temp(c.dew_point_2m)}`} />
        <Tile icon={Droplets} label={t('common.humidity')} value={f.pct(c.relative_humidity_2m)}>
          <Meter value={c.relative_humidity_2m} max={100} color="#3987e5" />
        </Tile>
        <Tile icon={Wind} label={t('common.wind')} value={f.wind(c.wind_speed_10m)} sub={`${t('common.gusts')}: ${f.wind(c.wind_gusts_10m)}`}>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
            <Navigation2 className="h-4 w-4 text-brand-500 dark:text-brand-300" style={{ transform: `rotate(${(c.wind_direction_10m + 180) % 360}deg)` }} />
            <span className="muted">
              {f.direction(c.wind_direction_10m)} · {Math.round(c.wind_direction_10m)}°
            </span>
          </div>
        </Tile>
        <Tile icon={Gauge} label={t('common.pressure')} value={f.pressure(c.pressure_msl)} />
        <Tile icon={Eye} label={t('common.visibility')} value={f.km(c.visibility)} sub={vis ? t(`visibilityLevel.${vis}`) : null} />
        <Tile icon={Sun} label={t('common.uvIndex')} value={f.num(uv, 1)} sub={uvl ? t(`uv.${uvl}`) : null}>
          <Meter value={uv ?? 0} max={11} color="#eda100" />
        </Tile>
        <Tile icon={Cloud} label={t('common.cloudCover')} value={f.pct(c.cloud_cover)}>
          <Meter value={c.cloud_cover} max={100} color="#8a93a6" />
        </Tile>
        <Tile icon={Leaf} label={t('common.aqi')} value={aqi != null ? f.num(aqi) : '—'} sub={t(`aqiLevel.${aq.key}`)} to="/air-quality">
          <Meter value={aqi ?? 0} max={300} color={aq.color} />
        </Tile>
        <div className="stat-tile col-span-2 md:col-span-3 xl:col-span-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">{t('dashboard.sunCycle')}</p>
            <p className="muted text-xs font-semibold">
              {t('common.daylight')}: {f.duration(d.daylight_duration[0])}
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-end gap-4">
            <div>
              <Sunrise className="h-5 w-5 text-amber-400" />
              <p className="muted mt-1 text-xs font-semibold">{t('common.sunrise')}</p>
              <p className="text-lg font-extrabold">{f.time(d.sunrise[0])}</p>
            </div>
            <SunArc sunrise={d.sunrise[0]} sunset={d.sunset[0]} now={c.time} />
            <div className="text-right">
              <Sunset className="ml-auto h-5 w-5 text-orange-400" />
              <p className="muted mt-1 text-xs font-semibold">{t('common.sunset')}</p>
              <p className="text-lg font-extrabold">{f.time(d.sunset[0])}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

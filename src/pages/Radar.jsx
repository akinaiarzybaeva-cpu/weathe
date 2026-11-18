import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Cloud, CloudRain, Crosshair, Info, Layers, Loader2, Pause, Play, Snowflake, Thermometer, Wind } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useWeather } from '../context/WeatherContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useAsync } from '../hooks/useAsync.js';
import { getAppConfig, getGrid, getRadarFrames } from '../services/api.js';
import { loadJSON, saveJSON } from '../lib/storage.js';
import { escapeHtml } from '../lib/colorScale.js';
import BaseMap, { MapControls } from '../components/map/BaseMap.jsx';
import { PageHeader, Toggle } from '../components/ui/States.jsx';

const DEFAULT_LAYERS = { radar: true, snow: true, clouds: false, wind: true, owmClouds: false, owmWind: false, owmTemp: false };

function windColor(kmh) {
  if (kmh < 10) return '#3987e5';
  if (kmh < 25) return '#199e70';
  if (kmh < 40) return '#eda100';
  if (kmh < 60) return '#eb6834';
  return '#e34948';
}

const WIND_STEPS = [0, 10, 25, 40, 60];

function windIcon(dir, kmh, label) {
  const rot = (dir + 180) % 360; // arrow points where the wind blows to
  const color = windColor(kmh);
  return L.divIcon({
    className: 'wind-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateZ(0)">
      <svg width="26" height="26" viewBox="0 0 24 24" style="transform:rotate(${rot}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">
        <path d="M12 2 L18 20 L12 16 L6 20 Z" fill="${color}" stroke="white" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>
      <span style="font:800 10px Manrope,sans-serif;color:#fff;background:rgba(15,18,25,.7);border-radius:6px;padding:0 4px;margin-top:1px">${label}</span>
    </div>`,
  });
}

/** Fetches live grid data for the visible map area (debounced on pan/zoom). */
function GridLayer({ showClouds, showWind }) {
  const map = useMap();
  const f = useFormat();
  const { t } = useI18n();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const reqId = useRef(0);

  const load = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const b = map.getBounds();
      const bounds = { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
      if (bounds.east - bounds.west > 200) {
        setPoints([]);
        return;
      }
      const id = ++reqId.current;
      setLoading(true);
      getGrid(bounds, 7)
        .then((pts) => id === reqId.current && setPoints(pts))
        .catch(() => id === reqId.current && setPoints([]))
        .finally(() => id === reqId.current && setLoading(false));
    }, 450);
  }, [map]);

  useMapEvents({ moveend: load });
  useEffect(() => {
    if (showClouds || showWind) load();
    return () => clearTimeout(timer.current);
  }, [load, showClouds, showWind]);

  const radius = useMemo(() => {
    const b = map.getBounds();
    return (((b.getNorth() - b.getSouth()) / 7) * 111000) / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points]);

  return (
    <>
      {loading && (
        <div className="glass absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold dark:bg-ink-900/80">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('common.loading')}
        </div>
      )}
      {showClouds &&
        points.map((p) => (
          <Circle
            key={`c-${p.latitude}-${p.longitude}`}
            center={[p.latitude, p.longitude]}
            radius={radius}
            pathOptions={{ stroke: false, fillColor: '#e8edf7', fillOpacity: (p.cloud_cover / 100) * 0.55 }}
          >
            <Tooltip direction="top" className="kg-tip">
              {t('common.cloudCover')}: {f.pct(p.cloud_cover)}
            </Tooltip>
          </Circle>
        ))}
      {showWind &&
        points.map((p) => (
          <Marker
            key={`w-${p.latitude}-${p.longitude}-${f.windLabel}`}
            position={[p.latitude, p.longitude]}
            icon={windIcon(p.wind_direction_10m, p.wind_speed_10m, f.num(f.windValue(p.wind_speed_10m)))}
            interactive={false}
          />
        ))}
    </>
  );
}

function Recenter({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.pos, Math.max(map.getZoom(), 6), { duration: 0.8 });
  }, [map, target]);
  return null;
}

function LayerRow({ icon: Icon, label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl px-1 py-2 ${disabled ? 'opacity-50' : ''}`}>
      <Icon className="muted h-4 w-4" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <Toggle checked={checked} onChange={disabled ? () => {} : onChange} label={label} />
    </label>
  );
}

export default function Radar() {
  const { t } = useI18n();
  const f = useFormat();
  const { notify } = useToast();
  const { location } = useWeather();
  const frames = useAsync(getRadarFrames, []);
  const config = useAsync(getAppConfig, []);
  const [layers, setLayers] = useState(() => ({ ...DEFAULT_LAYERS, ...loadJSON('radarLayers', {}) }));
  const [frameIdx, setFrameIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [target, setTarget] = useState(null);
  const [myPos, setMyPos] = useState(null);

  useEffect(() => saveJSON('radarLayers', layers), [layers]);
  const set = (key) => (v) => setLayers((l) => ({ ...l, [key]: v }));

  const radarFrames = useMemo(() => {
    const r = frames.data?.radar;
    return r ? [...(r.past || []), ...(r.nowcast || [])] : [];
  }, [frames.data]);
  const pastCount = frames.data?.radar?.past?.length ?? 0;

  useEffect(() => {
    if (radarFrames.length) setFrameIdx(Math.max(0, pastCount - 1));
  }, [radarFrames.length, pastCount]);

  useEffect(() => {
    if (!playing || !radarFrames.length) return undefined;
    const id = setInterval(() => setFrameIdx((i) => (i + 1) % radarFrames.length), 700);
    return () => clearInterval(id);
  }, [playing, radarFrames.length]);

  const frame = radarFrames[frameIdx];
  const owm = config.data?.owmTiles;
  const frameTime = frame ? new Date(frame.time * 1000) : null;

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      notify(t('settings.locationUnsupported'), 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude];
        setMyPos(p);
        setTarget({ pos: p, at: Date.now() });
      },
      (err) => notify(err.code === err.PERMISSION_DENIED ? t('settings.locationDenied') : t('settings.locationUnavailable'), 'error'),
      { timeout: 12000 },
    );
  };

  return (
    <div>
      <PageHeader title={t('radar.title')} subtitle={t('radar.subtitle')} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card overflow-hidden p-0 sm:p-0">
          <div className="relative h-[60vh] min-h-[420px] lg:h-[680px]">
            <BaseMap center={[location.latitude, location.longitude]} zoom={6} minZoom={3} maxZoom={12}>
              <MapControls
                onLocate={locateMe}
                locateLabel={t('radar.locate')}
                extra={
                  <button
                    type="button"
                    className="icon-btn-solid bg-white/80 dark:bg-ink-850/80"
                    onClick={() => setTarget({ pos: [location.latitude, location.longitude], at: Date.now() })}
                    aria-label={t('radar.recenter')}
                    title={t('radar.recenter')}
                  >
                    <Crosshair className="h-4 w-4" />
                  </button>
                }
              />
              <Recenter target={target} />
              {layers.radar && frame && frames.data?.host && (
                <TileLayer
                  key={`${frame.path}-${layers.snow}`}
                  url={`${frames.data.host}${frame.path}/256/{z}/{x}/{y}/2/1_${layers.snow ? 1 : 0}.png`}
                  opacity={0.75}
                  maxNativeZoom={7}
                  maxZoom={12}
                  zIndex={20}
                  attribution='Radar &copy; <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>'
                />
              )}
              {owm && layers.owmClouds && <TileLayer url="/api/tiles/owm/clouds_new/{z}/{x}/{y}.png" opacity={0.8} zIndex={15} attribution="&copy; OpenWeatherMap" />}
              {owm && layers.owmTemp && <TileLayer url="/api/tiles/owm/temp_new/{z}/{x}/{y}.png" opacity={0.6} zIndex={14} attribution="&copy; OpenWeatherMap" />}
              {owm && layers.owmWind && <TileLayer url="/api/tiles/owm/wind_new/{z}/{x}/{y}.png" opacity={0.7} zIndex={16} attribution="&copy; OpenWeatherMap" />}
              <GridLayer showClouds={layers.clouds} showWind={layers.wind} />
              <Marker
                position={[location.latitude, location.longitude]}
                icon={L.divIcon({ className: 'wx-marker', html: `<div class="city-pin active">${escapeHtml(f.placeName(location))}</div>`, iconSize: [0, 0] })}
                interactive={false}
              />
              {myPos && (
                <Circle center={myPos} radius={1500} pathOptions={{ color: '#5c6ee8', fillColor: '#5c6ee8', fillOpacity: 0.4, weight: 2 }} />
              )}
            </BaseMap>

            {layers.radar && (
              <div className="glass absolute inset-x-3 bottom-3 z-[500] flex items-center gap-3 rounded-2xl px-3 py-2 dark:bg-ink-900/85">
                <button
                  type="button"
                  className="icon-btn h-9 w-9 bg-brand-500 text-white hover:bg-brand-600"
                  onClick={() => setPlaying((p) => !p)}
                  disabled={!radarFrames.length}
                  aria-label={playing ? t('radar.pause') : t('radar.play')}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, radarFrames.length - 1)}
                  value={Math.max(0, frameIdx)}
                  onChange={(e) => {
                    setPlaying(false);
                    setFrameIdx(Number(e.target.value));
                  }}
                  className="flex-1 accent-brand-500"
                  aria-label={t('radar.frame')}
                  disabled={!radarFrames.length}
                />
                <span className="w-14 text-right text-xs font-bold tabular-nums">
                  {frameTime ? frameTime.toLocaleTimeString(f.locale, { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                </span>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="card">
            <p className="card-title mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" /> {t('radar.layers')}
            </p>
            <div className="divide-y divide-black/5 dark:divide-white/5">
              <LayerRow icon={CloudRain} label={t('radar.precipitation')} checked={layers.radar} onChange={set('radar')} />
              <LayerRow icon={Snowflake} label={t('radar.snow')} checked={layers.snow} onChange={set('snow')} disabled={!layers.radar} />
              <LayerRow icon={Cloud} label={t('radar.clouds')} checked={layers.clouds} onChange={set('clouds')} />
              <LayerRow icon={Wind} label={t('radar.wind')} checked={layers.wind} onChange={set('wind')} />
              {owm && (
                <>
                  <LayerRow icon={Cloud} label={`${t('radar.clouds')} · OWM`} checked={layers.owmClouds} onChange={set('owmClouds')} />
                  <LayerRow icon={Wind} label={`${t('radar.wind')} · OWM`} checked={layers.owmWind} onChange={set('owmWind')} />
                  <LayerRow icon={Thermometer} label={`${t('radar.temperature')} · OWM`} checked={layers.owmTemp} onChange={set('owmTemp')} />
                </>
              )}
            </div>
          </div>

          {layers.radar && (
            <div className="card">
              <p className="eyebrow mb-2">{t('radar.precipitation')}</p>
              <div className="h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg,#88ddee,#0099cc,#0077aa,#ffee00,#ffaa00,#ff4400,#c10000)' }} />
              <div className="muted mt-1 flex justify-between text-[11px] font-semibold">
                <span>{t('radar.light')}</span>
                <span>{t('radar.heavy')}</span>
              </div>
              {layers.wind && (
                <>
                  <p className="eyebrow mb-2 mt-4">
                    {t('radar.wind')} ({f.windLabel})
                  </p>
                  <div className="flex gap-1">
                    {WIND_STEPS.map((min) => (
                      <div key={min} className="flex-1 text-center">
                        <div className="h-2.5 rounded-sm" style={{ background: windColor(min) }} />
                        <span className="muted text-[10px] font-semibold">{f.num(f.windValue(min))}+</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="card space-y-2 text-xs">
            <p className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span className="muted">{t('radar.radarCoverage')}</span>
            </p>
            {(layers.clouds || layers.wind) && <p className="muted">{t('radar.gridNote')}</p>}
            <p className="muted">{config.data && (owm ? t('radar.owmOn') : t('radar.owmOff'))}</p>
            {frames.error && <p className="text-rose-400">{t('radar.noFrames')}</p>}
            <p className="muted">{t('radar.sources')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

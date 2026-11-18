import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeoJSON, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Droplets, LayoutDashboard, MapPin, Wind } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useSelectedLocation } from '../context/LocationContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useKgWeather } from '../hooks/useKgWeather.js';
import { useAsync } from '../hooks/useAsync.js';
import { getJSON } from '../services/api.js';
import { KG_BOUNDS, KG_CITIES, KG_REGIONS, cityById, kgCityToLocation, regionCenter } from '../data/kyrgyzstan.js';
import { TEMP_LEGEND, escapeHtml, tempColor } from '../lib/colorScale.js';
import BaseMap, { MapControls } from '../components/map/BaseMap.jsx';
import WeatherIcon from '../components/weather/WeatherIcon.jsx';
import FavoriteButton from '../components/weather/FavoriteButton.jsx';
import { ErrorState, PageHeader, Skeleton } from '../components/ui/States.jsx';

function FitKyrgyzstan() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(KG_BOUNDS, { paddingTopLeft: [110, 10], paddingBottomRight: [20, 10] });
  }, [map]);
  return null;
}

function cityIcon(label, temp, color, active, placement) {
  return L.divIcon({
    className: 'wx-marker',
    html: `<div class="city-pin ${active ? 'active' : ''} ${placement ? `pin-${placement}` : ''}"><span class="dot" style="background:${color}"></span>${escapeHtml(label)} ${escapeHtml(temp)}</div>`,
    iconSize: [0, 0],
  });
}

function RegionPanel({ city, weather }) {
  const { t } = useI18n();
  const f = useFormat();
  const navigate = useNavigate();
  const { setLocation } = useSelectedLocation();
  const loc = kgCityToLocation(city);
  const c = weather?.current;
  const d = weather?.daily;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{t(`kg.regions.${city.region}`)}</p>
          <h2 className="mt-1 flex items-center gap-1.5 text-xl font-extrabold">
            <MapPin className="h-5 w-5 text-brand-500" /> {t(`kg.cities.${city.id}`)}
          </h2>
          {KG_REGIONS.some((r) => r.center === city.id) && <p className="muted text-xs">{t('kg.regionCenter', { city: t(`kg.cities.${city.id}`) })}</p>}
        </div>
        <FavoriteButton location={loc} />
      </div>

      {!c ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <div className="flex items-center justify-between rounded-3xl bg-sky-accent p-5 text-slate-900">
            <div>
              <p className="text-5xl font-extrabold tracking-tighter">{f.temp(c.temperature_2m)}</p>
              <p className="mt-1 font-bold">{f.condition(c.weather_code)}</p>
              <p className="text-sm font-semibold text-slate-700">
                {t('common.feelsLike')} {f.temp(c.apparent_temperature)}
              </p>
            </div>
            <WeatherIcon code={c.weather_code} isDay={c.is_day === 1} className="h-20 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="stat-tile flex items-center gap-2 p-3">
              <Droplets className="h-4 w-4 text-sky-500" />
              <span className="muted">{t('common.humidity')}</span>
              <span className="ml-auto font-bold">{f.pct(c.relative_humidity_2m)}</span>
            </div>
            <div className="stat-tile flex items-center gap-2 p-3">
              <Wind className="h-4 w-4 text-emerald-500" />
              <span className="muted">{t('common.wind')}</span>
              <span className="ml-auto font-bold">{f.wind(c.wind_speed_10m)}</span>
            </div>
          </div>
          {d && (
            <div className="scroll-x">
              {d.time.map((day, i) => (
                <div key={day} className="flex min-w-[64px] flex-col items-center gap-1 rounded-2xl bg-black/[0.035] px-2 py-2.5 text-center dark:bg-white/[0.04]">
                  <span className="text-[11px] font-bold">{f.dayName(day, c.time)}</span>
                  <WeatherIcon code={d.weather_code[i]} className="h-6 w-6" />
                  <span className="text-sm font-extrabold">{f.temp(d.temperature_2m_max[i])}</span>
                  <span className="muted text-[11px] font-semibold">{f.temp(d.temperature_2m_min[i])}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="btn-primary w-full"
        onClick={() => {
          setLocation(loc);
          navigate('/');
        }}
      >
        <LayoutDashboard className="h-4 w-4" /> {t('kg.showOnDashboard')}
      </button>
    </div>
  );
}

export default function KyrgyzstanMap() {
  const { t } = useI18n();
  const f = useFormat();
  const { location } = useSelectedLocation();
  const kg = useKgWeather();
  const geo = useAsync(() => getJSON('/data/kg-regions.geojson', 24 * 60 * 60 * 1000), []);
  const [selectedCity, setSelectedCity] = useState(() => (location.kgId && cityById(location.kgId) ? location.kgId : 'bishkek'));

  const city = cityById(selectedCity);
  const selectedRegion = city.region;

  const regionStyle = useMemo(
    () => (feature) => {
      const id = feature.properties.id;
      const temp = kg.data?.[regionCenter(id)?.id]?.current?.temperature_2m;
      const active = id === selectedRegion;
      return {
        fillColor: tempColor(temp),
        fillOpacity: active ? 0.62 : 0.4,
        color: active ? '#5c6ee8' : '#ffffff',
        weight: active ? 3 : 1.2,
        opacity: active ? 1 : 0.7,
      };
    },
    [kg.data, selectedRegion],
  );

  const onEachRegion = (feature, layer) => {
    const id = feature.properties.id;
    layer.bindTooltip(escapeHtml(t(`kg.regions.${id}`)), { sticky: true, className: 'kg-tip', direction: 'top' });
    layer.on({
      click: () => setSelectedCity(regionCenter(id).id),
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.7 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: id === selectedRegion ? 0.62 : 0.4 }),
    });
  };

  return (
    <div>
      <PageHeader title={t('kg.title')} subtitle={t('kg.subtitle')} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card self-start overflow-hidden p-0 sm:p-0">
          <div className="relative h-[58vh] min-h-[380px] rounded-3xl lg:h-[640px]">
            {geo.error ? (
              <ErrorState error={geo.error} onRetry={geo.reload} messageKey="errors.map" />
            ) : (
              <BaseMap center={[41.4, 74.8]} zoom={6} minZoom={5} maxBounds={[[35, 62], [47, 88]]}>
                <FitKyrgyzstan />
                <MapControls />
                {geo.data && (
                  <GeoJSON
                    key={`${selectedRegion}-${kg.data ? 'live' : 'empty'}-${t('kg.regions.chuy')}`}
                    data={geo.data}
                    style={regionStyle}
                    onEachFeature={onEachRegion}
                  />
                )}
                {KG_CITIES.map((c) => {
                  const w = kg.data?.[c.id]?.current;
                  return (
                    <Marker
                      key={`${c.id}-${f.tempUnitLabel}-${selectedCity === c.id}-${w ? 1 : 0}-${t(`kg.cities.${c.id}`)}`}
                      position={[c.latitude, c.longitude]}
                      icon={cityIcon(t(`kg.cities.${c.id}`), w ? f.temp(w.temperature_2m) : '…', tempColor(w?.temperature_2m), selectedCity === c.id, c.pin)}
                      eventHandlers={{ click: () => setSelectedCity(c.id) }}
                      keyboard
                      title={t(`kg.cities.${c.id}`)}
                    />
                  );
                })}
              </BaseMap>
            )}

            <div className="glass pointer-events-none absolute bottom-3 left-3 z-[500] rounded-2xl px-3 py-2 dark:bg-ink-900/80">
              <p className="mb-1.5 text-[11px] font-bold">{t('kg.legend')}</p>
              <div className="flex items-center gap-1">
                {TEMP_LEGEND.map((v) => (
                  <div key={v} className="flex flex-col items-center gap-0.5">
                    <span className="h-2.5 w-7 rounded-sm" style={{ background: tempColor(v) }} />
                    <span className="muted text-[10px] font-semibold">{f.temp(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            {kg.error ? <ErrorState error={kg.error} onRetry={kg.reload} compact /> : <RegionPanel city={city} weather={kg.data?.[city.id]} />}
          </div>

          <div className="card">
            <p className="card-title mb-3">{t('kg.regionsList')}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {KG_REGIONS.map((r) => {
                const center = cityById(r.center);
                const w = kg.data?.[center.id]?.current;
                const active = selectedRegion === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCity(center.id)}
                    className={`flex items-center gap-3 rounded-2xl p-2.5 text-left text-sm transition ${active ? 'bg-brand-500 text-white' : 'bg-black/[0.035] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]'}`}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: tempColor(w?.temperature_2m) }} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{t(`kg.regions.${r.id}`)}</span>
                    {w && <WeatherIcon code={w.weather_code} isDay={w.is_day === 1} className="h-5 w-5" />}
                    <span className="w-10 text-right font-extrabold">{w ? f.temp(w.temperature_2m) : '…'}</span>
                  </button>
                );
              })}
            </div>
            <p className="muted mt-3 text-[11px]">{t('kg.boundariesSource')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

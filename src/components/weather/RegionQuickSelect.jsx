import { useI18n } from '../../context/SettingsContext.jsx';
import { useSelectedLocation } from '../../context/LocationContext.jsx';
import { KG_REGIONS, cityById, kgCityToLocation } from '../../data/kyrgyzstan.js';
import { useFormat } from '../../hooks/useFormat.js';
import WeatherIcon from './WeatherIcon.jsx';

/**
 * The original Weatherly "Regions of Kyrgyzstan" selector, upgraded:
 * shows live temperatures and loads the region's centre on click.
 */
export default function RegionQuickSelect({ kgWeather }) {
  const { t } = useI18n();
  const f = useFormat();
  const { location, setLocation } = useSelectedLocation();

  return (
    <section className="card animate-fade-up" aria-labelledby="regions-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="regions-title" className="card-title">
          {t('dashboard.regionsTitle')}
        </h2>
        <p className="muted text-xs">{t('dashboard.regionsHint')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7" aria-live="polite">
        {KG_REGIONS.map((region) => {
          const city = cityById(region.center);
          const active = location.kgId === city.id;
          const w = kgWeather?.[city.id]?.current;
          return (
            <button
              key={region.id}
              type="button"
              aria-pressed={active}
              onClick={() => setLocation(kgCityToLocation(city))}
              className={`flex min-h-[96px] flex-col justify-between gap-2 rounded-2xl p-3 text-left transition hover:-translate-y-0.5 ${
                active ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-glow' : 'bg-black/[0.035] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]'
              }`}
            >
              <span className="text-[13px] font-extrabold leading-tight">{t(`kg.regions.${region.id}`)}</span>
              <span className="flex items-center justify-between gap-2">
                <span className={`truncate text-xs font-semibold ${active ? 'text-white/85' : 'muted'}`}>{t(`kg.cities.${city.id}`)}</span>
                {w ? (
                  <span className="flex items-center gap-1 text-sm font-extrabold">
                    <WeatherIcon code={w.weather_code} isDay={w.is_day === 1} className="h-5 w-5" />
                    {f.temp(w.temperature_2m)}
                  </span>
                ) : (
                  <span className="skeleton h-4 w-10" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

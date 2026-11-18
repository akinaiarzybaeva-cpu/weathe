import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useSelectedLocation } from '../../context/LocationContext.jsx';
import { KG_CITIES, kgCityToLocation } from '../../data/kyrgyzstan.js';
import { useFormat } from '../../hooks/useFormat.js';
import WeatherIcon from './WeatherIcon.jsx';
import { ErrorState, Skeleton } from '../ui/States.jsx';

/** "Other large cities" list from the design, using live Kyrgyz city data. */
export default function KgCitiesCard({ kgWeather, limit = 5 }) {
  const { t } = useI18n();
  const f = useFormat();
  const { location, setLocation } = useSelectedLocation();

  return (
    <section className="card animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-title">{t('dashboard.otherCities')}</h2>
        <Link to="/kyrgyzstan" className="muted inline-flex items-center gap-0.5 text-xs font-bold hover:text-brand-500">
          {t('dashboard.showAll')} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {kgWeather.error ? (
        <ErrorState error={kgWeather.error} onRetry={kgWeather.reload} compact />
      ) : (
        <ul className="space-y-2">
          {KG_CITIES.filter((c) => c.id !== location.kgId)
            .slice(0, limit)
            .map((city) => {
              const w = kgWeather.data?.[city.id]?.current;
              return (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => setLocation(kgCityToLocation(city))}
                    className="flex w-full items-center gap-3 rounded-2xl bg-black/[0.035] p-3 text-left transition hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="muted text-[11px] font-semibold">{t(`kg.regions.${city.region}`)}</p>
                      <p className="truncate font-bold">{t(`kg.cities.${city.id}`)}</p>
                      <p className="muted truncate text-xs">{w ? f.condition(w.weather_code) : ' '}</p>
                    </div>
                    {w ? (
                      <div className="flex flex-col items-end gap-1">
                        <WeatherIcon code={w.weather_code} isDay={w.is_day === 1} className="h-8 w-8" />
                        <span className="text-lg font-extrabold">{f.temp(w.temperature_2m)}</span>
                      </div>
                    ) : (
                      <Skeleton className="h-12 w-12" />
                    )}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}

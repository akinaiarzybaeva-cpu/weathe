import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useWeather } from '../context/WeatherContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useKgWeather } from '../hooks/useKgWeather.js';
import { dailyRows, nextHours } from '../lib/forecast.js';
import { aqiLevel } from '../lib/aqi.js';
import CurrentWeatherCard, { CurrentWeatherSkeleton } from '../components/weather/CurrentWeatherCard.jsx';
import Highlights, { HighlightsSkeleton } from '../components/weather/Highlights.jsx';
import HourlyStrip from '../components/weather/HourlyStrip.jsx';
import DailyCards from '../components/weather/DailyCards.jsx';
import RegionQuickSelect from '../components/weather/RegionQuickSelect.jsx';
import KgCitiesCard from '../components/weather/KgCitiesCard.jsx';
import AlertItem from '../components/weather/AlertItem.jsx';
import HourlyTempChart from '../components/charts/HourlyTempChart.jsx';
import RainChanceChart from '../components/charts/RainChanceChart.jsx';
import { ErrorState, SectionHeader, Skeleton, SkeletonCard } from '../components/ui/States.jsx';

function LinkAction({ to, children }) {
  return (
    <Link to={to} className="muted inline-flex items-center gap-0.5 text-xs font-bold hover:text-brand-500">
      {children} <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function AqiSummary({ air }) {
  const { t } = useI18n();
  const f = useFormat();
  if (air.loading && !air.data) return <SkeletonCard lines={2} />;
  if (air.error) return <div className="card"><ErrorState error={air.error} onRetry={air.reload} messageKey="errors.air" compact /></div>;
  const aqi = air.data?.current?.us_aqi;
  const lvl = aqiLevel(aqi);
  return (
    <section className="card animate-fade-up">
      <SectionHeader title={t('dashboard.airSummary')} action={<LinkAction to="/air-quality">{t('dashboard.openAir')}</LinkAction>} />
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-2xl font-extrabold text-white" style={{ background: lvl.color }}>
          {aqi != null ? f.num(aqi) : '—'}
        </div>
        <div className="min-w-0">
          <p className="font-bold">{t(`aqiLevel.${lvl.key}`)}</p>
          <p className="muted mt-1 text-sm">{lvl.key !== 'unknown' ? t(`air.advice.${lvl.key}`)[0] : t('empty.noData')}</p>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { location, forecast, air, alerts } = useWeather();
  const kgWeather = useKgWeather();
  const data = forecast.data;

  if (forecast.error) {
    return (
      <div className="card">
        <ErrorState error={forecast.error} onRetry={forecast.reload} />
      </div>
    );
  }

  const hours = data ? nextHours(data, 24) : [];
  const days = data ? dailyRows(data).slice(0, 7) : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="min-w-0 space-y-5">
        {data ? <CurrentWeatherCard location={location} forecast={data} /> : <CurrentWeatherSkeleton />}

        {alerts.some((a) => a.severity === 'danger') && data && (
          <div className="space-y-2">
            {alerts
              .filter((a) => a.severity === 'danger')
              .slice(0, 2)
              .map((a) => (
                <AlertItem key={a.id} alert={a} todayIso={data.current.time} />
              ))}
          </div>
        )}

        <section className="card">
          <SectionHeader title={t('dashboard.week')} action={<LinkAction to="/forecast">{t('dashboard.openForecast')}</LinkAction>} />
          {data ? (
            <DailyCards days={days} todayIso={data.current.time} onSelect={(day) => navigate(`/forecast?day=${day}`)} />
          ) : (
            <div className="flex gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 min-w-[96px] flex-1 rounded-3xl" />
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <SectionHeader title={t('dashboard.hourly')} />
          {data ? (
            <div className="space-y-5">
              <HourlyStrip hours={hours} />
              <HourlyTempChart hours={hours} />
            </div>
          ) : (
            <Skeleton className="h-64" />
          )}
        </section>

        {data ? <Highlights forecast={data} air={air.data} /> : <HighlightsSkeleton />}
      </div>

      <div className="min-w-0 space-y-5">
        <section className="card">
          <SectionHeader title={t('dashboard.rainChart')} />
          {data ? <RainChanceChart hours={hours.slice(0, 12)} /> : <Skeleton className="h-48" />}
        </section>
        <AqiSummary air={air} />
        <KgCitiesCard kgWeather={kgWeather} />
      </div>

      <div className="min-w-0 xl:col-span-2">
        <RegionQuickSelect kgWeather={kgWeather.data} />
      </div>
    </div>
  );
}

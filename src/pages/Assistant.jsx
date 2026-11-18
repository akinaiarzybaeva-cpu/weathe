import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, KeyRound, Loader2, SendHorizontal, Sparkles, Trash2, User } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { useWeather } from '../context/WeatherContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { useAsync } from '../hooks/useAsync.js';
import { useKgWeather } from '../hooks/useKgWeather.js';
import { useFavoritesWeather } from '../hooks/useFavoritesWeather.js';
import { askAssistant, getAppConfig } from '../services/api.js';
import { dailyRows, nextHours } from '../lib/forecast.js';
import { aqiLevel } from '../lib/aqi.js';
import { uvLevel } from '../lib/units.js';
import { KG_CITIES } from '../data/kyrgyzstan.js';
import { loadJSON, saveJSON } from '../lib/storage.js';
import { PageHeader, Skeleton } from '../components/ui/States.jsx';

/** Compact, unit-formatted snapshot of the real data the model may use. */
function useWeatherContext() {
  const f = useFormat();
  const { t } = useI18n();
  const { location, forecast, air, alerts } = useWeather();
  const kg = useKgWeather();
  const favs = useFavoritesWeather();

  return useMemo(() => {
    const data = forecast.data;
    if (!data) return null;
    const c = data.current;
    const cityLine = (name, w) =>
      w?.current && {
        place: name,
        temperature: f.tempFull(w.current.temperature_2m),
        feels_like: f.tempFull(w.current.apparent_temperature),
        condition: f.condition(w.current.weather_code),
        humidity: f.pct(w.current.relative_humidity_2m),
        wind: f.wind(w.current.wind_speed_10m),
        today_max: f.tempFull(w.daily?.temperature_2m_max?.[0]),
        today_min: f.tempFull(w.daily?.temperature_2m_min?.[0]),
        today_precip_probability: f.pct(w.daily?.precipitation_probability_max?.[0]),
        tomorrow: w.daily?.time?.[1] && {
          max: f.tempFull(w.daily.temperature_2m_max[1]),
          min: f.tempFull(w.daily.temperature_2m_min[1]),
          condition: f.condition(w.daily.weather_code[1]),
          precip_probability: f.pct(w.daily.precipitation_probability_max[1]),
        },
      };

    const aq = air.data?.current;
    return {
      selected_location: {
        name: f.placeName(location),
        region_country: f.placeSubtitle(location),
        local_time: `${c.time} (${data.timezone})`,
        current: {
          temperature: f.tempFull(c.temperature_2m),
          feels_like: f.tempFull(c.apparent_temperature),
          condition: f.condition(c.weather_code),
          is_day: c.is_day === 1,
          humidity: f.pct(c.relative_humidity_2m),
          wind: `${f.wind(c.wind_speed_10m)} ${f.direction(c.wind_direction_10m)}`,
          gusts: f.wind(c.wind_gusts_10m),
          pressure: f.pressure(c.pressure_msl),
          visibility: f.km(c.visibility),
          uv_index: `${c.uv_index}${uvLevel(c.uv_index) ? ` (${t(`uv.${uvLevel(c.uv_index)}`)})` : ''}`,
          cloud_cover: f.pct(c.cloud_cover),
          precipitation_now: f.mm(c.precipitation),
        },
        next_24_hours: nextHours(data, 24)
          .filter((_, i) => i % 3 === 0)
          .map((h) => ({
            time: h.time,
            temperature: f.tempFull(h.temperature_2m),
            condition: f.condition(h.weather_code),
            precip_probability: f.pct(h.precipitation_probability),
            wind: f.wind(h.wind_speed_10m),
          })),
        daily_7_days: dailyRows(data)
          .slice(0, 8)
          .map((d) => ({
            date: d.time,
            weekday: f.weekday(d.time, 'long'),
            condition: f.condition(d.weather_code),
            max: f.tempFull(d.temperature_2m_max),
            min: f.tempFull(d.temperature_2m_min),
            precip_probability: f.pct(d.precipitation_probability_max),
            precipitation: f.mm(d.precipitation_sum),
            snowfall: f.cm(d.snowfall_sum),
            max_wind: f.wind(d.wind_speed_10m_max),
            max_gusts: f.wind(d.wind_gusts_10m_max),
            uv_max: d.uv_index_max,
            sunrise: d.sunrise?.slice(11),
            sunset: d.sunset?.slice(11),
          })),
        air_quality: aq
          ? {
              us_aqi: aq.us_aqi,
              category: t(`aqiLevel.${aqiLevel(aq.us_aqi).key}`),
              pm2_5: `${aq.pm2_5} μg/m³`,
              pm10: `${aq.pm10} μg/m³`,
              ozone: `${aq.ozone} μg/m³`,
              no2: `${aq.nitrogen_dioxide} μg/m³`,
            }
          : 'unavailable',
        alerts_derived_from_forecast: alerts.map((a) => ({ date: a.date, type: t(`alerts.${a.type}.title`), severity: a.severity })),
      },
      kyrgyzstan_cities_now: kg.data ? KG_CITIES.map((city) => cityLine(t(`kg.cities.${city.id}`), kg.data[city.id])).filter(Boolean) : 'loading',
      favorite_cities_now: favs.data ? favs.favorites.map((fav) => cityLine(f.placeName(fav), favs.data[fav.id])).filter(Boolean) : [],
    };
  }, [forecast.data, air.data, alerts, kg.data, favs.data, favs.favorites, location, f, t]);
}

function ConfigMessage() {
  const { t } = useI18n();
  return (
    <div className="card mx-auto max-w-2xl text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-500">
        <KeyRound className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-extrabold">{t('assistant.notConfiguredTitle')}</h2>
      <p className="muted mt-2 text-sm">{t('assistant.notConfiguredBody')}</p>
      <pre className="mx-auto mt-4 max-w-md overflow-x-auto rounded-2xl bg-black/80 p-4 text-left text-sm text-emerald-300">
        <code>{'# .env\nANTHROPIC_API_KEY=sk-ant-...'}</code>
      </pre>
      <p className="muted mt-4 text-xs">{t('assistant.notConfiguredNote')}</p>
    </div>
  );
}

export default function Assistant() {
  const { t, lang } = useI18n();
  const f = useFormat();
  const { location } = useWeather();
  const config = useAsync(getAppConfig, []);
  const context = useWeatherContext();
  const [messages, setMessages] = useState(() => loadJSON('assistantChat', []));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => saveJSON('assistantChat', messages.slice(-30)), [messages]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [messages, busy]);

  const send = async (text) => {
    const q = text.trim();
    if (!q || busy) return;
    if (!context) {
      setError('noWeather');
      return;
    }
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setError(null);
    setBusy(true);
    try {
      const reply = await askAssistant({ messages: next, weather: context, lang });
      setMessages((m) => [...m, { role: 'assistant', content: reply || t('assistant.errors.generic') }]);
    } catch (err) {
      const code = err.kind === 'network' ? 'network' : ['auth', 'rate_limit', 'refusal', 'network'].includes(err.message) ? err.message : 'generic';
      if (err.kind === 'config') config.reload();
      setError(code);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  if (config.loading) {
    return (
      <div>
        <PageHeader title={t('assistant.title')} subtitle={t('assistant.checking')} />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('assistant.title')}
        subtitle={t('assistant.subtitle', { place: f.placeName(location) })}
        actions={
          config.data?.ai &&
          messages.length > 0 && (
            <button type="button" className="btn-soft" onClick={() => setMessages([])}>
              <Trash2 className="h-4 w-4" /> {t('assistant.clear')}
            </button>
          )
        }
      />

      {!config.data?.ai ? (
        <ConfigMessage />
      ) : (
        <div className="card flex h-[calc(100vh-15rem)] min-h-[480px] flex-col p-0 sm:p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-black/[0.04] px-4 py-3 text-sm dark:bg-white/[0.05]">{t('assistant.welcome')}</div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.role === 'user' ? 'bg-sky-accent text-slate-900' : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white'}`}
                  aria-label={m.role === 'user' ? t('assistant.you') : t('assistant.name')}
                >
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                    m.role === 'user' ? 'rounded-tr-md bg-brand-500 text-white' : 'rounded-tl-md bg-black/[0.04] dark:bg-white/[0.05]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <span className="muted text-sm">{t('assistant.thinking')}</span>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500 dark:text-rose-300">
                {t(`assistant.errors.${error}`)}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-black/5 p-3 dark:border-white/5 sm:p-4">
            {messages.length === 0 && (
              <div className="scroll-x mb-3 pb-1">
                {t('assistant.suggestions').map((s) => (
                  <button key={s} type="button" className="btn-soft shrink-0 whitespace-nowrap px-3 py-2 text-xs" onClick={() => send(s)} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                ref={inputRef}
                className="input"
                placeholder={t('assistant.placeholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                aria-label={t('assistant.placeholder')}
              />
              <button type="submit" className="btn-primary h-11 w-11 shrink-0 p-0" disabled={busy || !input.trim()} aria-label={t('assistant.send')}>
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
            <p className="muted mt-2 text-[11px]">{t('assistant.contextNote', { place: f.placeName(location) })}</p>
          </div>
        </div>
      )}
    </div>
  );
}

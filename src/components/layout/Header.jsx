import { useEffect, useRef, useState } from 'react';
import { Bell, Languages, MapPin, Menu, Moon, Sun } from 'lucide-react';
import { useI18n, useSettings } from '../../context/SettingsContext.jsx';
import { useWeather } from '../../context/WeatherContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';
import { LANGUAGES } from '../../i18n/translations.js';
import CitySearch from '../weather/CitySearch.jsx';
import AlertItem from '../weather/AlertItem.jsx';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    const onKey = (e) => e.key === 'Escape' && onOutside();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, onOutside]);
}

function AlertsMenu() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const { alerts, forecast } = useWeather();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const danger = alerts.some((a) => a.severity === 'danger');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="icon-btn-solid relative"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('header.notifications')}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {alerts.length > 0 && (
          <span className={`absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white ${danger ? 'bg-rose-500' : 'bg-amber-500'}`}>
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="glass fixed inset-x-3 top-[72px] z-[1100] max-h-[70vh] overflow-y-auto rounded-3xl p-4 shadow-glass dark:bg-ink-850/95 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">{t('header.notifications')}</p>
            {alerts.length > 0 && <span className="chip bg-brand-500/15 text-brand-500 dark:text-brand-300">{t('alerts.count', { count: alerts.length })}</span>}
          </div>
          {!settings.alertsEnabled ? (
            <p className="muted text-sm">{t('header.alertsDisabled')}</p>
          ) : alerts.length === 0 ? (
            <p className="muted text-sm">{t('header.noAlerts')}</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <AlertItem key={a.id} alert={a} todayIso={forecast.data?.current?.time} />
              ))}
            </div>
          )}
          <p className="muted mt-3 text-[11px]">{t('alerts.derivedNote')}</p>
        </div>
      )}
    </div>
  );
}

function LanguageMenu() {
  const { t, lang } = useI18n();
  const { update } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="icon-btn-solid w-auto gap-1.5 px-3 text-xs font-bold"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('header.language')}
        aria-expanded={open}
      >
        <Languages className="h-4 w-4" />
        {current?.short}
      </button>
      {open && (
        <div className="glass absolute right-0 top-full z-[1100] mt-2 w-44 rounded-2xl p-1.5 shadow-glass dark:bg-ink-850/95" role="menu">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === lang}
              onClick={() => {
                update({ language: l.code });
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5 ${l.code === lang ? 'text-brand-500 dark:text-brand-300' : ''}`}
            >
              {l.label}
              <span className="muted text-xs">{l.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeSwitch({ className = 'hidden sm:flex' }) {
  const { t } = useI18n();
  const { isDark, update } = useSettings();
  return (
    <div className={`glass items-center rounded-full p-1 ${className}`} role="group" aria-label={t('header.toggleTheme')}>
      <button
        type="button"
        onClick={() => update({ theme: 'light' })}
        aria-pressed={!isDark}
        aria-label={t('settings.light')}
        className={`grid h-8 w-8 place-items-center rounded-full transition ${!isDark ? 'bg-white text-amber-500 shadow' : 'muted'}`}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => update({ theme: 'dark' })}
        aria-pressed={isDark}
        aria-label={t('settings.dark')}
        className={`grid h-8 w-8 place-items-center rounded-full transition ${isDark ? 'bg-sky-accent text-slate-900 shadow' : 'muted'}`}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Header({ onOpenMenu }) {
  const { t } = useI18n();
  const { location } = useWeather();
  const f = useFormat();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'py-2' : 'py-3 sm:py-4'}`}>
      <div className={`flex items-center gap-2 rounded-[22px] px-2 py-2 transition-all sm:gap-3 ${scrolled ? 'glass shadow-glass dark:bg-ink-900/80' : ''}`}>
        <button type="button" className="icon-btn-solid lg:hidden" onClick={onOpenMenu} aria-label={t('header.openMenu')}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 items-center gap-2 md:flex" title={f.placeSubtitle(location)}>
          <MapPin className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300" />
          <span className="truncate text-sm font-bold">
            {f.placeName(location)}
            {(location.countryCode || location.country) && <span className="muted font-semibold">, {location.countryCode || location.country}</span>}
          </span>
        </div>

        <CitySearch className="min-w-0 flex-1 md:mx-auto md:max-w-md" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeSwitch />
          <LanguageMenu />
          <AlertsMenu />
        </div>
      </div>
    </header>
  );
}

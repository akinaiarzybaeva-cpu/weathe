import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage.js';
import { translations, LANGUAGES } from '../i18n/translations.js';

export const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light' | 'system'
  tempUnit: 'c', // 'c' | 'f'
  windUnit: 'kmh', // 'kmh' | 'ms' | 'mph' | 'kn'
  pressureUnit: 'hpa', // 'hpa' | 'mmhg'
  language: 'ru', // 'ky' | 'ru' | 'en'
  autoLocate: false,
  alertsEnabled: true,
  animatedBg: true,
};

const SettingsContext = createContext(null);

function detectInitialLanguage() {
  const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (nav.startsWith('ky')) return 'ky';
  if (nav.startsWith('en')) return 'en';
  return DEFAULT_SETTINGS.language;
}

function usePrefersDark() {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? true);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = (e) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return dark;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = loadJSON('settings', null);
    return { ...DEFAULT_SETTINGS, language: detectInitialLanguage(), ...(saved || {}) };
  });
  const prefersDark = usePrefersDark();
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);

  useEffect(() => saveJSON('settings', settings), [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0b0d12' : '#eef2fb');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS, language: settings.language }), [settings.language]);

  const value = useMemo(() => ({ settings, update, reset, isDark }), [settings, update, reset, isDark]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* i18n                                                                */
/* ------------------------------------------------------------------ */

function lookup(dict, path) {
  return path.split('.').reduce((obj, k) => (obj == null ? undefined : obj[k]), dict);
}

export function useI18n() {
  const { settings } = useSettings();
  const lang = settings.language;
  return useMemo(() => {
    const dict = translations[lang] || translations.en;
    const locale = LANGUAGES.find((l) => l.code === lang)?.locale || 'en-GB';
    const t = (key, vars) => {
      let v = lookup(dict, key);
      if (v === undefined) {
        v = lookup(translations.en, key);
        if (import.meta.env.DEV) console.warn(`[i18n] missing "${key}" for ${lang}`);
      }
      if (v === undefined) return key;
      if (typeof v === 'string' && vars) {
        return v.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
      }
      return v;
    };
    return { t, lang, locale };
  }, [lang]);
}

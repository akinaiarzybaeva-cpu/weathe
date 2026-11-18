import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { searchCities } from '../../services/api.js';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useSelectedLocation } from '../../context/LocationContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// Letters (any script), spaces, dots, apostrophes and hyphens only.
const VALID_CITY = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

/**
 * Worldwide city search with autocomplete (Open-Meteo geocoding).
 * Selecting a result makes it the app-wide location and fetches real weather.
 */
export default function CitySearch({ className = '', onSelected, navigateTo }) {
  const { t, lang } = useI18n();
  const { num } = useFormat();
  const { setLocation, locate, locating } = useSelectedLocation();
  const { notify } = useToast();
  const navigate = useNavigate();
  const listId = useId();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error | invalid
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const debounced = useDebounced(query.trim());

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }
    if (!VALID_CITY.test(debounced)) {
      setResults([]);
      setStatus('invalid');
      return undefined;
    }
    let cancelled = false;
    setStatus('loading');
    searchCities(debounced, lang)
      .then((list) => {
        if (cancelled) return;
        setResults(list);
        setActive(list.length ? 0 : -1);
        setStatus('done');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [debounced, lang]);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (loc) => {
    setLocation(loc);
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
    onSelected?.(loc);
    if (navigateTo) navigate(navigateTo);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      if (q.length < 2 || !VALID_CITY.test(q)) {
        notify(t('search.invalid'), 'error');
        return;
      }
      if (results[active] && debounced === q) {
        choose(results[active]);
      } else if (status === 'done' && debounced === q && !results.length) {
        notify(t('errors.cityNotFound'), 'error');
      } else {
        // User pressed Enter before the debounce fired – search immediately.
        setStatus('loading');
        searchCities(q, lang)
          .then((list) => (list.length ? choose(list[0]) : notify(t('errors.cityNotFound'), 'error')))
          .catch(() => notify(t('search.error'), 'error'))
          .finally(() => setStatus('idle'));
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="muted pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t('search.placeholder')}
          className="input pl-11 pr-10"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
        />
        {status === 'loading' ? (
          <Loader2 className="muted absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
        ) : (
          query && (
            <button
              type="button"
              className="icon-btn absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {showPanel && (
        <div className="glass absolute left-0 right-0 top-full z-[1100] mt-2 overflow-hidden rounded-2xl p-1.5 shadow-glass dark:bg-ink-850/95">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-brand-500 hover:bg-black/5 dark:text-brand-300 dark:hover:bg-white/5"
            onClick={async () => {
              setOpen(false);
              const loc = await locate();
              if (loc) {
                onSelected?.(loc);
                if (navigateTo) navigate(navigateTo);
              }
            }}
            disabled={locating}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {locating ? t('settings.locating') : t('search.useLocation')}
          </button>

          <ul id={listId} role="listbox" className="max-h-80 overflow-y-auto">
            {status === 'idle' && query.trim().length === 1 && <li className="muted px-3 py-2.5 text-sm">{t('search.minChars')}</li>}
            {status === 'invalid' && <li className="px-3 py-2.5 text-sm text-rose-400">{t('search.invalid')}</li>}
            {status === 'loading' && <li className="muted px-3 py-2.5 text-sm">{t('search.searching')}</li>}
            {status === 'error' && <li className="px-3 py-2.5 text-sm text-rose-400">{t('search.error')}</li>}
            {status === 'done' && results.length === 0 && (
              <li className="muted px-3 py-2.5 text-sm">{t('search.noResults', { query: debounced })}</li>
            )}
            {status === 'done' &&
              results.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(r)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? 'bg-black/5 dark:bg-white/[0.07]' : ''}`}
                  >
                    <MapPin className="muted h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.name}</span>
                      <span className="muted block truncate text-xs">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
                    </span>
                    {r.countryCode && <span className="chip bg-black/5 dark:bg-white/10">{r.countryCode}</span>}
                    {r.population ? <span className="muted hidden text-[11px] sm:inline">{t('search.population', { value: num(r.population) })}</span> : null}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

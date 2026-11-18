import { CloudOff, RefreshCw, SearchX } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Card-shaped loading placeholder. */
export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`card space-y-3 ${className}`} aria-busy="true">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
  );
}

function errorMessage(error, t, fallbackKey) {
  if (!error) return t(fallbackKey);
  if (error.kind === 'network') return t('errors.network');
  return t(fallbackKey);
}

export function ErrorState({ error, onRetry, messageKey = 'errors.weather', compact = false }) {
  const { t } = useI18n();
  return (
    <div role="alert" className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? 'py-6' : 'py-12'}`}>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-400">
        <CloudOff className="h-6 w-6" />
      </div>
      <div>
        <p className="font-bold">{t('errors.title')}</p>
        <p className="muted mt-1 text-sm">{errorMessage(error, t, messageKey)}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-soft" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = SearchX, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-400">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-lg font-bold">{title}</p>
      {hint && <p className="muted max-w-sm text-sm">{hint}</p>}
      {action}
    </div>
  );
}

export function SectionHeader({ title, action, subtitle }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="card-title">{title}</h2>
        {subtitle && <p className="muted mt-0.5 text-xs">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Segmented control. options: [{ value, label }] */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${checked ? 'bg-brand-500' : 'bg-black/15 dark:bg-white/15'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

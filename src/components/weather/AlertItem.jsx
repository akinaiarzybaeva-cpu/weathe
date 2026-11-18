import { CloudLightning, CloudRain, Snowflake, ThermometerSnowflake, ThermometerSun, Wind } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';

const ICONS = {
  storm: CloudLightning,
  heavyRain: CloudRain,
  snow: Snowflake,
  strongWind: Wind,
  heat: ThermometerSun,
  cold: ThermometerSnowflake,
};

const SEVERITY_STYLE = {
  danger: 'bg-rose-500/15 text-rose-500 dark:text-rose-300',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
};

/** One derived weather alert, fully localised and unit-aware. */
export default function AlertItem({ alert, todayIso }) {
  const { t } = useI18n();
  const f = useFormat();
  const Icon = ICONS[alert.type] || CloudLightning;

  const value =
    alert.kind === 'mm' ? f.mm(alert.value) : alert.kind === 'cm' ? f.cm(alert.value) : alert.kind === 'wind' ? f.wind(alert.value) : alert.kind === 'temp' ? f.tempFull(alert.value) : '';
  const desc = t(`alerts.${alert.type}.desc`, { value, condition: alert.code != null ? f.condition(alert.code) : '' });

  return (
    <div className="flex gap-3 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${SEVERITY_STYLE[alert.severity]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold">{t(`alerts.${alert.type}.title`)}</p>
          <span className={`chip px-2 py-0.5 text-[10px] ${SEVERITY_STYLE[alert.severity]}`}>{t(`alerts.severity.${alert.severity}`)}</span>
        </div>
        <p className="muted mt-0.5 text-xs font-semibold">
          {f.dayName(alert.date, todayIso, 'long')} · {f.date(alert.date)}
        </p>
        <p className="mt-1 text-sm">{desc}</p>
      </div>
    </div>
  );
}

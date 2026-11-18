import { Droplet } from 'lucide-react';
import { useFormat } from '../../hooks/useFormat.js';
import WeatherIcon from './WeatherIcon.jsx';

/**
 * Compact day cards (Tue/Wed/Thu… strip from the design).
 * When `onSelect` is passed the cards become selectable buttons.
 */
export default function DailyCards({ days, todayIso, selected, onSelect }) {
  const f = useFormat();
  return (
    <div className="scroll-x">
      {days.map((d) => {
        const active = selected === d.time;
        return (
          <button
            key={d.time}
            type="button"
            onClick={() => onSelect?.(d.time)}
            aria-pressed={onSelect ? active : undefined}
            className={`flex min-w-[96px] flex-1 shrink-0 flex-col items-center gap-2 rounded-3xl px-3 py-4 text-center transition hover:-translate-y-0.5 ${
              active ? 'bg-sky-accent text-slate-900 shadow-glass' : 'bg-black/[0.035] dark:bg-white/[0.04]'
            }`}
          >
            <p className="text-sm font-bold">{f.dayName(d.time, todayIso)}</p>
            <p className={`text-[11px] font-semibold ${active ? 'text-slate-700' : 'muted'}`}>{f.date(d.time)}</p>
            <div className={`my-1 h-px w-10 ${active ? 'bg-slate-900/15' : 'bg-black/10 dark:bg-white/10'}`} />
            <WeatherIcon code={d.weather_code} className="h-10 w-10" title={f.condition(d.weather_code)} />
            <p className="text-xl font-extrabold">{f.temp(d.temperature_2m_max)}</p>
            <p className={`text-xs font-semibold ${active ? 'text-slate-700' : 'muted'}`}>{f.temp(d.temperature_2m_min)}</p>
            <p className={`flex items-center gap-0.5 text-[11px] font-bold ${active ? 'text-slate-800' : 'text-sky-500 dark:text-sky-300'}`}>
              <Droplet className="h-3 w-3" /> {f.pct(d.precipitation_probability_max)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

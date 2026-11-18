import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';
import { axisProps, useChartTheme } from './chartTheme.js';
import ChartTooltip from './ChartTooltip.jsx';

/** Chance-of-rain bars for the coming hours (single series, no legend needed). */
export default function RainChanceChart({ hours, height = 200 }) {
  const { t } = useI18n();
  const f = useFormat();
  const c = useChartTheme();
  const data = hours.map((h) => ({ time: h.time, rain: h.precipitation_probability ?? 0, mm: h.precipitation }));
  const dry = data.every((d) => !d.rain);

  return (
    <div className="relative" style={{ height }} role="img" aria-label={t('dashboard.rainChart')}>
      {dry && <p className="muted absolute inset-x-0 top-1/3 z-10 text-center text-sm font-semibold">{t('dashboard.noRain')}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={3}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="time" tickFormatter={(v) => f.time(v)} interval="preserveStartEnd" minTickGap={18} {...axisProps(c)} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} {...axisProps(c)} width={40} />
          <Tooltip
            cursor={{ fill: c.grid }}
            content={
              <ChartTooltip
                labelFormat={(v) => `${f.weekday(v)} ${f.time(v)}`}
                rows={[
                  { key: 'rain', label: t('common.rainChance'), color: c.s1, format: (v) => `${v}%` },
                  { key: 'mm', label: t('common.precipitation'), color: '#8a93a6', format: (v) => f.mm(v) },
                ]}
              />
            }
          />
          <Bar dataKey="rain" fill={c.s1} radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

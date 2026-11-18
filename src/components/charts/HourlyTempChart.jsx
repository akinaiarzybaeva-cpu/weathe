import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';
import { axisProps, useChartTheme } from './chartTheme.js';
import ChartTooltip from './ChartTooltip.jsx';

/** Interactive hourly temperature + feels-like chart (values in user units). */
export default function HourlyTempChart({ hours, height = 220 }) {
  const { t } = useI18n();
  const f = useFormat();
  const c = useChartTheme();

  const data = hours.map((h) => ({
    time: h.time,
    temp: f.tempValue(h.temperature_2m),
    feels: f.tempValue(h.apparent_temperature),
    rain: h.precipitation_probability,
  }));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs font-semibold" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: c.s1 }} /> {t('common.temperature')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t-2 border-dashed" style={{ borderColor: c.s2 }} /> {t('common.feelsLike')}
        </span>
      </div>
      <div style={{ height }} role="img" aria-label={t('forecast.tempChart')}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.s1} stopOpacity={0.28} />
                <stop offset="100%" stopColor={c.s1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="time" tickFormatter={(v) => f.time(v)} interval="preserveStartEnd" minTickGap={24} {...axisProps(c)} />
            <YAxis {...axisProps(c)} width={44} tickFormatter={(v) => `${v}°`} domain={[(min) => Math.floor((min - 1) / 5) * 5, (max) => Math.ceil((max + 1) / 5) * 5]} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: c.cursor, strokeWidth: 1 }}
              content={
                <ChartTooltip
                  labelFormat={(v) => `${f.weekday(v)} ${f.time(v)}`}
                  rows={[
                    { key: 'temp', label: t('common.temperature'), color: c.s1, format: (v) => `${v}${f.tempUnitLabel}` },
                    { key: 'feels', label: t('common.feelsLike'), color: c.s2, format: (v) => `${v}${f.tempUnitLabel}` },
                    { key: 'rain', label: t('common.rainChance'), color: '#8a93a6', format: (v) => `${v}%` },
                  ]}
                />
              }
            />
            <Area type="monotone" dataKey="temp" stroke={c.s1} strokeWidth={2} fill="url(#tempFill)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: c.surface }} />
            <Area type="monotone" dataKey="feels" stroke={c.s2} strokeWidth={2} strokeDasharray="5 4" fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: c.surface }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Shared Recharts tooltip. `rows` formats each payload entry:
 *   rows={[{ key: 'temp', label: 'Temperature', format: (v) => '12°', color }]}
 */
export default function ChartTooltip({ active, payload, label, labelFormat, rows }) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded-xl border border-black/5 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-ink-850/95">
      <p className="mb-1 font-bold">{labelFormat ? labelFormat(label, datum) : label}</p>
      {rows.map((r) => {
        const v = datum[r.key];
        if (v == null) return null;
        return (
          <p key={r.key} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            <span className="muted">{r.label}</span>
            <span className="ml-auto pl-3 font-bold tabular-nums">{r.format ? r.format(v) : v}</span>
          </p>
        );
      })}
    </div>
  );
}

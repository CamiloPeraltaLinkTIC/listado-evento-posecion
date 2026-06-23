"use client";

interface Props {
  total: number;
  attended: number;
}

export default function StatsBar({ total, attended }: Props) {
  const pending = Math.max(0, total - attended);
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  const stats = [
    { label: "Registrados", value: total, accent: "text-ink" },
    { label: "Asistieron", value: attended, accent: "text-moss-600" },
    { label: "Pendientes", value: pending, accent: "text-amber-400" },
  ];

  return (
    <div className="card lift overflow-hidden rounded-2xl">
      <div className="grid grid-cols-3 divide-x divide-line">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-5 sm:px-7 sm:py-6">
            <p className="eyebrow">{s.label}</p>
            <p
              className={`font-display text-4xl font-semibold tabular-nums leading-none sm:text-5xl ${s.accent}`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de progreso editorial */}
      <div className="border-t border-line px-5 py-3.5 sm:px-7">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="eyebrow">Avance del check-in</span>
          <span className="font-mono text-sm font-medium text-ink">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-moss-500 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

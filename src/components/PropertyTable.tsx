import { useMemo } from "react";
import type { PropertyDef } from "@/lib/coolprop/properties";
import { fmt, PHASE_LABELS } from "@/lib/coolprop/properties";

export interface PropertyRow {
  def: PropertyDef;
  value: number | null;
  error?: string;
}

export function PropertyTable({ rows }: { rows: PropertyRow[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, PropertyRow[]>();
    for (const r of rows) {
      const g = r.def.group;
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(r);
    }
    return Array.from(m.entries());
  }, [rows]);

  return (
    <div className="space-y-4">
      {grouped.map(([group, groupRows]) => (
        <section
          key={group}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <header className="border-b border-border bg-secondary/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            {group}
          </header>
          <ul className="divide-y divide-border">
            {groupRows.map((r) => {
              const isPhase = r.def.key === "Phase";
              const display =
                r.value === null
                  ? "—"
                  : isPhase && Number.isFinite(r.value)
                    ? `${PHASE_LABELS[Math.round(r.value)] ?? "—"} (${Math.round(r.value)})`
                    : fmt(r.value);
              return (
                <li
                  key={r.def.key}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{r.def.label}</div>
                    <div className="text-xs text-muted-foreground">{r.def.unit}</div>
                  </div>
                  <div
                    className={
                      "shrink-0 font-mono tabular-nums " +
                      (r.value === null ? "text-muted-foreground" : "text-foreground")
                    }
                    title={r.error}
                  >
                    {display}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
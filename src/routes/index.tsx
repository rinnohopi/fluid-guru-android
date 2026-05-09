import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Beaker, Wind, AlertTriangle, Search } from "lucide-react";
import { loadCoolProp, safeCall, type CoolPropModule } from "@/lib/coolprop";
import {
  INPUT_PAIRS,
  PROPERTIES,
  TRIVIAL_PROPERTIES,
  HUMID_AIR_INPUTS,
  HUMID_AIR_OUTPUTS,
} from "@/lib/coolprop/properties";
import { PropertyTable, type PropertyRow } from "@/components/PropertyTable";

export const Route = createFileRoute("/")({ component: FluidPropsApp });

type Mode = "fluid" | "humid-air";

function FluidPropsApp() {
  const [cp, setCp] = useState<CoolPropModule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fluids, setFluids] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("fluid");

  useEffect(() => {
    let alive = true;
    loadCoolProp()
      .then((m) => {
        if (!alive) return;
        setCp(m);
        try {
          const list = m.get_global_param_string("FluidsList").split(",").filter(Boolean).sort();
          setFluids(list);
        } catch {
          setFluids([]);
        }
      })
      .catch((e) => alive && setLoadError(e?.message ?? "Failed to load CoolProp"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">FluidProps</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                CoolProp · WebAssembly
              </p>
            </div>
          </div>
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 pb-16">
        {loadError && (
          <ErrorBanner
            title="Failed to load CoolProp"
            message={loadError}
          />
        )}
        {!cp && !loadError && <LoadingState />}
        {cp &&
          (mode === "fluid" ? (
            <FluidPanel cp={cp} fluids={fluids} />
          ) : (
            <HumidAirPanel cp={cp} />
          ))}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Calculations performed locally using CoolProp{" "}
          {cp ? cp.get_global_param_string("version") : ""} compiled to WebAssembly.
        </footer>
      </main>
    </div>
  );
}

/* ----------------------------- Mode switch ----------------------------- */

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const Btn = ({ value, icon: Icon, label }: { value: Mode; icon: typeof Beaker; label: string }) => (
    <button
      onClick={() => onChange(value)}
      className={
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors " +
        (mode === value
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5">
      <Btn value="fluid" icon={Beaker} label="Fluid" />
      <Btn value="humid-air" icon={Wind} label="Humid air" />
    </div>
  );
}

/* ----------------------------- Fluid panel ----------------------------- */

function FluidPanel({ cp, fluids }: { cp: CoolPropModule; fluids: string[] }) {
  const [fluid, setFluid] = useState<string>("Water");
  const [pairId, setPairId] = useState<string>("PT");
  const [v1, setV1] = useState<string>("101325");
  const [v2, setV2] = useState<string>("298.15");

  const pair = useMemo(() => INPUT_PAIRS.find((p) => p.id === pairId)!, [pairId]);

  // Reset values to placeholders when input pair changes
  useEffect(() => {
    setV1(pair.a.placeholder ?? "");
    setV2(pair.b.placeholder ?? "");
  }, [pairId, pair.a.placeholder, pair.b.placeholder]);

  const num1 = Number(v1);
  const num2 = Number(v2);
  const validInputs = Number.isFinite(num1) && Number.isFinite(num2) && v1.trim() !== "" && v2.trim() !== "";

  // Constants are independent of state inputs
  const constants = useMemo<PropertyRow[]>(() => {
    if (!fluid) return [];
    return TRIVIAL_PROPERTIES.map((def) => {
      const r = safeCall(() => cp.Props1SI(fluid, def.key));
      return { def, value: r.ok ? r.value : null, error: r.ok ? undefined : r.error };
    });
  }, [cp, fluid]);

  const stateRows = useMemo<PropertyRow[]>(() => {
    if (!validInputs || !fluid) return [];
    return PROPERTIES.map((def) => {
      const r = safeCall(() =>
        cp.PropsSI(def.key, pair.a.key, num1, pair.b.key, num2, fluid),
      );
      return { def, value: r.ok ? r.value : null, error: r.ok ? undefined : r.error };
    });
  }, [cp, fluid, pair, num1, num2, validInputs]);

  const firstError = stateRows.find((r) => r.value === null && r.error)?.error;
  const allFailed = stateRows.length > 0 && stateRows.every((r) => r.value === null);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <FluidPicker value={fluid} onChange={setFluid} fluids={fluids} />

        <div className="mt-3">
          <Label>Input pair</Label>
          <select
            value={pairId}
            onChange={(e) => setPairId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {INPUT_PAIRS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField
            label={pair.a.label}
            unit={pair.a.unit}
            value={v1}
            placeholder={pair.a.placeholder}
            onChange={setV1}
          />
          <NumberField
            label={pair.b.label}
            unit={pair.b.unit}
            value={v2}
            placeholder={pair.b.placeholder}
            onChange={setV2}
          />
        </div>
      </section>

      {allFailed && firstError && (
        <ErrorBanner title="State calculation failed" message={firstError} />
      )}

      {validInputs && stateRows.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties at state
          </h2>
          <PropertyTable rows={stateRows} />
        </div>
      )}

      <div>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fluid constants
        </h2>
        <PropertyTable rows={constants} />
      </div>
    </div>
  );
}

function FluidPicker({
  value,
  onChange,
  fluids,
}: {
  value: string;
  onChange: (v: string) => void;
  fluids: string[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fluids;
    return fluids.filter((f) => f.toLowerCase().includes(q));
  }, [fluids, query]);

  return (
    <div>
      <Label>Fluid</Label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${fluids.length} fluids…`}
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={Math.min(6, Math.max(4, filtered.length))}
        className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {filtered.length === 0 && <option disabled>No fluids match</option>}
        {filtered.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
        Selected: <span className="font-mono text-foreground">{value}</span>
      </p>
    </div>
  );
}

/* ----------------------------- Humid air panel ----------------------------- */

function HumidAirPanel({ cp }: { cp: CoolPropModule }) {
  const [k1, setK1] = useState<string>("T");
  const [v1, setV1] = useState<string>("298.15");
  const [k2, setK2] = useState<string>("P");
  const [v2, setV2] = useState<string>("101325");
  const [k3, setK3] = useState<string>("R");
  const [v3, setV3] = useState<string>("0.5");

  const num1 = Number(v1);
  const num2 = Number(v2);
  const num3 = Number(v3);
  const valid =
    Number.isFinite(num1) &&
    Number.isFinite(num2) &&
    Number.isFinite(num3) &&
    new Set([k1, k2, k3]).size === 3;

  const rows = useMemo<PropertyRow[]>(() => {
    if (!valid) return [];
    return HUMID_AIR_OUTPUTS.map((def) => {
      const r = safeCall(() => cp.HAPropsSI(def.key, k1, num1, k2, num2, k3, num3));
      return { def, value: r.ok ? r.value : null, error: r.ok ? undefined : r.error };
    });
  }, [cp, k1, k2, k3, num1, num2, num3, valid]);

  const firstError = rows.find((r) => r.value === null && r.error)?.error;
  const allFailed = rows.length > 0 && rows.every((r) => r.value === null);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-3 text-xs text-muted-foreground">
          Humid air requires <strong>three</strong> independent input variables (must include
          pressure). Pick three different keys.
        </p>
        <div className="space-y-3">
          <HumidInputRow label="Input 1" k={k1} v={v1} onK={setK1} onV={setV1} />
          <HumidInputRow label="Input 2" k={k2} v={v2} onK={setK2} onV={setV2} />
          <HumidInputRow label="Input 3" k={k3} v={v3} onK={setK3} onV={setV3} />
        </div>
      </section>

      {!valid && (
        <ErrorBanner
          title="Pick three distinct inputs"
          message="The three input keys must all differ and have numeric values."
        />
      )}

      {allFailed && firstError && (
        <ErrorBanner title="HAPropsSI failed" message={firstError} />
      )}

      {valid && rows.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Humid air properties
          </h2>
          <PropertyTable rows={rows} />
        </div>
      )}
    </div>
  );
}

function HumidInputRow({
  label,
  k,
  v,
  onK,
  onV,
}: {
  label: string;
  k: string;
  v: string;
  onK: (s: string) => void;
  onV: (s: string) => void;
}) {
  const def = HUMID_AIR_INPUTS.find((i) => i.key === k);
  return (
    <div className="grid grid-cols-5 items-end gap-2">
      <div className="col-span-2">
        <Label>{label}</Label>
        <select
          value={k}
          onChange={(e) => onK(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {HUMID_AIR_INPUTS.map((i) => (
            <option key={i.key} value={i.key}>
              {i.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-3">
        <Label>Value · <span className="font-normal text-muted-foreground">{def?.unit}</span></Label>
        <input
          inputMode="decimal"
          value={v}
          placeholder={def?.placeholder ?? ""}
          onChange={(e) => onV(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

/* ----------------------------- Shared bits ----------------------------- */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}

function NumberField({
  label,
  unit,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>
        {label} · <span className="font-normal">{unit}</span>
      </Label>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ErrorBanner({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 break-words text-xs opacity-90">{message}</div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground shadow-sm">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">Loading CoolProp WebAssembly (~6 MB, one-time)…</p>
    </div>
  );
}
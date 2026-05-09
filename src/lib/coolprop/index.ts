// CoolProp WASM loader (browser-only)
// Loads the vendored emscripten glue and points it at /wasm/coolprop.wasm

// @ts-expect-error - vendored emscripten glue has no types of its own
import Module from "./coolprop.js";

export interface CoolPropModule {
  PropsSI(output: string, n1: string, v1: number, n2: string, v2: number, fluid: string): number;
  Props1SI(fluid: string, output: string): number;
  HAPropsSI(output: string, n1: string, v1: number, n2: string, v2: number, n3: string, v3: number): number;
  PhaseSI?(n1: string, v1: number, n2: string, v2: number, fluid: string): string;
  get_global_param_string(param: string): string;
  get_fluid_param_string(fluid: string, param: string): string;
  F2K(t: number): number;
}

let instance: CoolPropModule | null = null;
let pending: Promise<CoolPropModule> | null = null;

export function loadCoolProp(): Promise<CoolPropModule> {
  if (instance) return Promise.resolve(instance);
  if (pending) return pending;
  pending = Module({
    locateFile: (path: string) => `/wasm/${path}`,
    print: () => {},
    printErr: () => {},
  }).then((m: CoolPropModule) => {
    instance = m;
    return m;
  });
  return pending;
}

/** Safely invoke a CoolProp call; returns NaN on error and the message. */
export function safeCall<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const value = fn();
    if (typeof value === "number" && !Number.isFinite(value as unknown as number)) {
      return { ok: false, error: "Non-finite result" };
    }
    return { ok: true, value };
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown CoolProp error";
    return { ok: false, error: msg.replace(/^.*?:\s*/, "") };
  }
}
// Output property catalog used by the UI to display all physical properties
// for a fluid at a given state. Units are SI from CoolProp PropsSI.

export type PropertyGroup =
  | "State"
  | "Energy (mass basis)"
  | "Energy (molar basis)"
  | "Heat capacity"
  | "Transport"
  | "Derived"
  | "Two-phase";

export interface PropertyDef {
  key: string;            // CoolProp PropsSI output key
  label: string;          // Human label
  unit: string;           // SI unit
  group: PropertyGroup;
  format?: (v: number) => string;
}

const sci = (v: number) => {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(4);
  return v.toPrecision(6);
};

export const fmt = sci;

export const PROPERTIES: PropertyDef[] = [
  // State
  { key: "T", label: "Temperature", unit: "K", group: "State" },
  { key: "P", label: "Pressure", unit: "Pa", group: "State" },
  { key: "D", label: "Density", unit: "kg/m³", group: "State" },
  { key: "Dmolar", label: "Molar density", unit: "mol/m³", group: "State" },
  { key: "Q", label: "Vapor quality", unit: "—", group: "State" },
  { key: "Phase", label: "Phase index", unit: "—", group: "State" },
  { key: "Z", label: "Compressibility Z", unit: "—", group: "State" },

  // Energy mass basis
  { key: "H", label: "Specific enthalpy", unit: "J/kg", group: "Energy (mass basis)" },
  { key: "S", label: "Specific entropy", unit: "J/(kg·K)", group: "Energy (mass basis)" },
  { key: "U", label: "Specific internal energy", unit: "J/kg", group: "Energy (mass basis)" },
  { key: "G", label: "Specific Gibbs energy", unit: "J/kg", group: "Energy (mass basis)" },
  { key: "HELMHOLTZMASS", label: "Specific Helmholtz energy", unit: "J/kg", group: "Energy (mass basis)" },

  // Energy molar basis
  { key: "Hmolar", label: "Molar enthalpy", unit: "J/mol", group: "Energy (molar basis)" },
  { key: "Smolar", label: "Molar entropy", unit: "J/(mol·K)", group: "Energy (molar basis)" },
  { key: "Umolar", label: "Molar internal energy", unit: "J/mol", group: "Energy (molar basis)" },
  { key: "Gmolar", label: "Molar Gibbs energy", unit: "J/mol", group: "Energy (molar basis)" },

  // Heat capacity
  { key: "C", label: "cp (mass)", unit: "J/(kg·K)", group: "Heat capacity" },
  { key: "O", label: "cv (mass)", unit: "J/(kg·K)", group: "Heat capacity" },
  { key: "Cpmolar", label: "cp (molar)", unit: "J/(mol·K)", group: "Heat capacity" },
  { key: "Cvmolar", label: "cv (molar)", unit: "J/(mol·K)", group: "Heat capacity" },
  { key: "Cp0mass", label: "cp ideal-gas (mass)", unit: "J/(kg·K)", group: "Heat capacity" },

  // Transport
  { key: "V", label: "Dynamic viscosity", unit: "Pa·s", group: "Transport" },
  { key: "L", label: "Thermal conductivity", unit: "W/(m·K)", group: "Transport" },
  { key: "Prandtl", label: "Prandtl number", unit: "—", group: "Transport" },
  { key: "A", label: "Speed of sound", unit: "m/s", group: "Transport" },
  { key: "I", label: "Surface tension", unit: "N/m", group: "Transport" },

  // Derived
  { key: "ISOBARIC_EXPANSION_COEFFICIENT", label: "Isobaric expansion β", unit: "1/K", group: "Derived" },
  { key: "ISOTHERMAL_COMPRESSIBILITY", label: "Isothermal compressibility κ", unit: "1/Pa", group: "Derived" },
  { key: "ISENTROPIC_EXPANSION_COEFFICIENT", label: "Isentropic exponent", unit: "—", group: "Derived" },
];

// Phase index decoder (CoolProp::phases enum)
export const PHASE_LABELS: Record<number, string> = {
  0: "Liquid",
  1: "Supercritical",
  2: "Supercritical gas",
  3: "Supercritical liquid",
  4: "Critical point",
  5: "Gas",
  6: "Two-phase",
  7: "Unknown",
  8: "Not imposed",
};

// CoolProp input pairs for PropsSI (two-property state inputs)
export interface InputPair {
  id: string;
  label: string;
  a: { key: string; label: string; unit: string; placeholder?: string };
  b: { key: string; label: string; unit: string; placeholder?: string };
}

export const INPUT_PAIRS: InputPair[] = [
  {
    id: "PT",
    label: "Pressure & Temperature",
    a: { key: "P", label: "Pressure", unit: "Pa", placeholder: "101325" },
    b: { key: "T", label: "Temperature", unit: "K", placeholder: "300" },
  },
  {
    id: "QT",
    label: "Quality & Temperature (saturation)",
    a: { key: "Q", label: "Quality", unit: "—", placeholder: "0 (sat. liq) … 1 (sat. vap)" },
    b: { key: "T", label: "Temperature", unit: "K", placeholder: "373.15" },
  },
  {
    id: "PQ",
    label: "Pressure & Quality (saturation)",
    a: { key: "P", label: "Pressure", unit: "Pa", placeholder: "101325" },
    b: { key: "Q", label: "Quality", unit: "—", placeholder: "0 … 1" },
  },
  {
    id: "HP",
    label: "Enthalpy & Pressure",
    a: { key: "H", label: "Specific enthalpy", unit: "J/kg" },
    b: { key: "P", label: "Pressure", unit: "Pa", placeholder: "101325" },
  },
  {
    id: "PS",
    label: "Pressure & Entropy",
    a: { key: "P", label: "Pressure", unit: "Pa", placeholder: "101325" },
    b: { key: "S", label: "Specific entropy", unit: "J/(kg·K)" },
  },
  {
    id: "HS",
    label: "Enthalpy & Entropy",
    a: { key: "H", label: "Specific enthalpy", unit: "J/kg" },
    b: { key: "S", label: "Specific entropy", unit: "J/(kg·K)" },
  },
  {
    id: "TS",
    label: "Temperature & Entropy",
    a: { key: "T", label: "Temperature", unit: "K", placeholder: "300" },
    b: { key: "S", label: "Specific entropy", unit: "J/(kg·K)" },
  },
  {
    id: "DT",
    label: "Density & Temperature",
    a: { key: "D", label: "Density", unit: "kg/m³" },
    b: { key: "T", label: "Temperature", unit: "K", placeholder: "300" },
  },
  {
    id: "DP",
    label: "Density & Pressure",
    a: { key: "D", label: "Density", unit: "kg/m³" },
    b: { key: "P", label: "Pressure", unit: "Pa", placeholder: "101325" },
  },
  {
    id: "PU",
    label: "Pressure & Internal energy",
    a: { key: "P", label: "Pressure", unit: "Pa" },
    b: { key: "U", label: "Specific internal energy", unit: "J/kg" },
  },
];

// Trivial (single-input) properties — fluid-only constants
export const TRIVIAL_PROPERTIES: PropertyDef[] = [
  { key: "MOLARMASS", label: "Molar mass", unit: "kg/mol", group: "State" },
  { key: "TCRIT", label: "Critical temperature", unit: "K", group: "State" },
  { key: "PCRIT", label: "Critical pressure", unit: "Pa", group: "State" },
  { key: "RHOCRIT", label: "Critical density", unit: "kg/m³", group: "State" },
  { key: "TTRIPLE", label: "Triple-point temperature", unit: "K", group: "State" },
  { key: "PTRIPLE", label: "Triple-point pressure", unit: "Pa", group: "State" },
  { key: "TMIN", label: "Minimum temperature", unit: "K", group: "State" },
  { key: "TMAX", label: "Maximum temperature", unit: "K", group: "State" },
  { key: "PMAX", label: "Maximum pressure", unit: "Pa", group: "State" },
  { key: "ACENTRIC", label: "Acentric factor", unit: "—", group: "State" },
  { key: "GAS_CONSTANT", label: "Gas constant", unit: "J/(mol·K)", group: "State" },
];

// Humid air output catalog (HAPropsSI)
export const HUMID_AIR_OUTPUTS: PropertyDef[] = [
  { key: "T", label: "Dry-bulb temperature", unit: "K", group: "State" },
  { key: "P", label: "Pressure", unit: "Pa", group: "State" },
  { key: "B", label: "Wet-bulb temperature", unit: "K", group: "State" },
  { key: "D", label: "Dew-point temperature", unit: "K", group: "State" },
  { key: "R", label: "Relative humidity", unit: "—", group: "State" },
  { key: "W", label: "Humidity ratio", unit: "kg_w/kg_da", group: "State" },
  { key: "Y", label: "Water mole fraction", unit: "mol/mol", group: "State" },
  { key: "Hha", label: "Mixture enthalpy (per kg humid air)", unit: "J/kg", group: "Energy (mass basis)" },
  { key: "Hda", label: "Mixture enthalpy (per kg dry air)", unit: "J/kg_da", group: "Energy (mass basis)" },
  { key: "Sha", label: "Mixture entropy (per kg humid air)", unit: "J/(kg·K)", group: "Energy (mass basis)" },
  { key: "Sda", label: "Mixture entropy (per kg dry air)", unit: "J/(kg_da·K)", group: "Energy (mass basis)" },
  { key: "Vha", label: "Mixture specific volume (per kg humid air)", unit: "m³/kg", group: "State" },
  { key: "Vda", label: "Mixture specific volume (per kg dry air)", unit: "m³/kg_da", group: "State" },
  { key: "Cha", label: "Mixture cp (per kg humid air)", unit: "J/(kg·K)", group: "Heat capacity" },
  { key: "Cda", label: "Mixture cp (per kg dry air)", unit: "J/(kg_da·K)", group: "Heat capacity" },
  { key: "M", label: "Dynamic viscosity", unit: "Pa·s", group: "Transport" },
  { key: "K", label: "Thermal conductivity", unit: "W/(m·K)", group: "Transport" },
  { key: "Z", label: "Compressibility factor", unit: "—", group: "Derived" },
];

export const HUMID_AIR_INPUTS = [
  { key: "T", label: "Dry-bulb temperature", unit: "K", placeholder: "298.15" },
  { key: "P", label: "Pressure", unit: "Pa", placeholder: "101325" },
  { key: "R", label: "Relative humidity (0–1)", unit: "—", placeholder: "0.5" },
  { key: "W", label: "Humidity ratio", unit: "kg_w/kg_da", placeholder: "0.01" },
  { key: "B", label: "Wet-bulb temperature", unit: "K", placeholder: "293.15" },
  { key: "D", label: "Dew-point temperature", unit: "K", placeholder: "283.15" },
  { key: "Hda", label: "Enthalpy (per kg dry air)", unit: "J/kg_da" },
  { key: "Sda", label: "Entropy (per kg dry air)", unit: "J/(kg_da·K)" },
  { key: "Vda", label: "Specific volume (per kg dry air)", unit: "m³/kg_da" },
] as const;
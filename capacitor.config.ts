import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for wrapping FluidProps as an Android APK.
 *
 * `webDir` must point at the static client output produced by `bun run build`.
 * For the TanStack Start template that is `dist/client` (the SSR client bundle).
 * Capacitor ships those files inside the APK and serves them locally.
 */
const config: CapacitorConfig = {
  appId: "app.fluidprops.android",
  appName: "FluidProps",
  webDir: "dist/client",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
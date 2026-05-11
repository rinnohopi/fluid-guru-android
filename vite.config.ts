import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// Plain client-only SPA build. No SSR, no Cloudflare Worker.
// Output (`dist/client/index.html` + assets) is what Capacitor ships in the APK.
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    target: "es2022",
  },
  // CoolProp's emscripten glue is large; let Vite skip the inline-asset warning.
  assetsInclude: ["**/*.wasm"],
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
});
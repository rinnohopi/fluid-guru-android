# Building the FluidProps Android APK

The web app already runs as an installable PWA. To produce a real `.apk`,
wrap it with Capacitor on your local machine. This **cannot** be done inside
the Lovable sandbox — Android Studio and the Android SDK are required.

## One-time setup (on your computer)

1. Install **Android Studio** (includes JDK 17 + Android SDK + emulator).
   <https://developer.android.com/studio>
2. Install **Node.js 20+** and **bun** (or npm).
3. Clone this repo and install deps:
   ```bash
   bun install
   ```

## Build the static web bundle

Capacitor ships the contents of `dist/client/` inside the APK. Build it first:

```bash
bun run build
```

> If `dist/client` doesn't appear, check the actual client output directory
> (e.g. `.output/public`) and update `webDir` in `capacitor.config.ts`
> accordingly.

## Add the Android platform (one time)

```bash
bunx cap add android
```

This creates an `android/` Gradle project. Commit it.

## Sync web assets into the native project (every time the web code changes)

```bash
bun run build && bunx cap sync android
```

## Open in Android Studio and build the APK

```bash
bunx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
The output `.apk` lives in `android/app/build/outputs/apk/debug/app-debug.apk`.

For a release-signed APK or AAB suitable for the Play Store, follow:
<https://capacitorjs.com/docs/android/deploying-to-google-play>

## Notes specific to this app

- CoolProp ships as a ~6 MB `.wasm` file. It is bundled into the APK by
  Vite as a hashed asset under `dist/client/assets/`. No network access is
  needed at runtime — the calculator works fully offline.
- WebAssembly works out of the box in the Android System WebView (Chrome 57+).
  The minimum Android version supported by Capacitor 8 is **Android 7.0
  (API 24)**.
- If you change the `appId` in `capacitor.config.ts` after running
  `cap add android`, regenerate the platform: `rm -rf android && bunx cap add android`.
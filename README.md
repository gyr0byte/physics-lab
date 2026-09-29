# Physics Lab

Interactive physics simulations for Grade 11 and Grade 12 students, following the Nepal secondary-level Physics curriculum. Designed for Android TV in a classroom setting.

## Status

**Version 0.1.0** — First vertical slice.

| Component | Status |
|-----------|--------|
| Simulation engine (TypeScript) | ✅ Working |
| Projectile Motion simulation | ✅ Working |
| Physics tests | ✅ 47 tests passing |
| Web build | ✅ Builds (23 KB bundle) |
| Desktop browser development | ✅ Working |
| Android TV shell (Kotlin/Compose) | ✅ Code complete |
| WebView integration | ✅ Code complete |
| APK build | ⏳ Requires SDK setup |

## Prerequisites

### For simulation development (web only)

- **Node.js** 20+ and npm
- That's it — simulation development happens in the browser

### For Android APK builds

| Requirement | Location | Notes |
|------------|----------|-------|
| JDK 17 | `D:\jdk-17` | Set `JAVA_HOME` |
| Android SDK | `D:\Android\Sdk` | Set `ANDROID_HOME` |
| Gradle cache | `D:\Gradle` | Set `GRADLE_USER_HOME` |
| SDK Platform | API 37 | Install via SDK Manager |
| Build Tools | 36.0.0 | Install via SDK Manager |

**Environment variables:**

```powershell
$env:JAVA_HOME = "D:\jdk-17"
$env:ANDROID_HOME = "D:\Android\Sdk"
$env:GRADLE_USER_HOME = "D:\Gradle"
```

## Quick Start

### Run simulation in browser (development)

```bash
cd simulation-web
npm install
npm run dev
```

Open http://localhost:5173 — the Projectile Motion simulation runs immediately.

### Run tests

```bash
cd simulation-web
npm test
```

### Build the web application

```bash
cd simulation-web
npm run build
```

Output: `simulation-web/dist/` (~24 KB)

### Copy web assets to Android

```powershell
.\scripts\copy-web-assets.ps1
```

### Build APK (after SDK setup)

```powershell
.\scripts\build-all.ps1
```

Or manually:

```powershell
cd android
.\gradlew.bat assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Install on Android TV

```powershell
adb connect <TV_IP>
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Project Structure

```
D:\Public High school\
│
├── android/                    # Android TV application
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/physicslab/app/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── data/CurriculumData.kt
│   │   │   │   ├── navigation/NavGraph.kt
│   │   │   │   └── ui/screens/
│   │   │   │       ├── HomeScreen.kt
│   │   │   │       ├── GradeScreen.kt
│   │   │   │       ├── ChapterScreen.kt
│   │   │   │       └── SimulationScreen.kt
│   │   │   ├── res/
│   │   │   ├── assets/simulation-web/  (generated)
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   ├── gradle/libs.versions.toml
│   ├── settings.gradle.kts
│   └── build.gradle.kts
│
├── simulation-web/             # TypeScript simulation application
│   ├── src/
│   │   ├── core/               # Simulation engine
│   │   │   ├── Vector2.ts
│   │   │   ├── SimulationClock.ts
│   │   │   ├── Camera2D.ts
│   │   │   ├── InputManager.ts
│   │   │   └── Simulation.ts
│   │   ├── physics/            # Pure math models
│   │   │   └── ProjectilePhysics.ts
│   │   ├── rendering/          # Canvas drawing
│   │   │   └── CanvasRenderer.ts
│   │   ├── components/         # UI components
│   │   │   └── Graph.ts
│   │   ├── simulations/        # Individual simulations
│   │   │   └── projectile-motion/
│   │   │       └── ProjectileMotionSimulation.ts
│   │   └── main.ts
│   ├── tests/
│   │   ├── core/vector2.test.ts
│   │   └── physics/projectile.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── index.html
│
├── docs/
│   ├── architecture.md
│   ├── curriculum-map.md
│   └── simulation-specs/
│       └── projectile-motion.md
│
├── scripts/
│   ├── copy-web-assets.ps1
│   └── build-all.ps1
│
├── AGENTS.md
└── README.md
```

## How to Add a New Simulation

1. Create `src/physics/YourPhysics.ts` — pure math model, no rendering
2. Create `src/simulations/your-sim/YourSimulation.ts` implementing the `Simulation` interface
3. Add tests in `tests/physics/your-sim.test.ts`
4. Register the simulation in `src/main.ts` (routing will be added)
5. Add curriculum data in `android/.../CurriculumData.kt`
6. Rebuild: `npm run build`, then `scripts/copy-web-assets.ps1`

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

## Keyboard / D-pad Controls

| Key | Action |
|-----|--------|
| ↑ ↓ | Navigate between controls |
| ← → | Adjust parameter value |
| Enter | Select / activate |
| Space | Play / Pause |
| Escape / Back | Return to previous screen |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Android shell | Kotlin, Jetpack Compose for TV |
| WebView | AndroidX WebKit, WebViewAssetLoader |
| Simulations | TypeScript, HTML5 Canvas, Vite |
| Physics | Pure TypeScript (analytic equations) |
| Tests | Vitest |
| Build | AGP 9.4.0, Gradle 9.6.1 |

## License

This project is educational software for a college in Nepal. License TBD.

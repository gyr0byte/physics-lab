# Physics Lab

Interactive physics simulations for Grade 11 and Grade 12 students, following the Nepal secondary-level Physics curriculum. Designed for Android TV in a classroom setting.

> [!NOTE]
> Physics Lab is an independent educational software project developed with classroom use in mind. It is not an official product or endorsement of the Curriculum Development Centre, Ministry of Education, or Shree Public High School.

## Product Vision & Scope

**Physics Lab is an interactive physics simulation application**, inspired by the active learning approach of PhET Interactive Simulations.

The central student experience is **experimentation and visualization**:
- Adjust physical parameters (e.g., launch angle, force, mass, wire length, frequency).
- Observe dynamic physical responses and trajectories in real time.
- Inspect vectors, measurements, and live graphs.
- Operate with intuitive Start, Pause, and Reset controls.
- Navigate seamlessly with an Android TV remote / D-pad in an offline classroom.

### Explicit Scope Boundaries (What We Are NOT Building)
To maintain focus on high-quality interactive physics simulations, the following are strictly out of scope:
- **No full textbook chapters or written digital notes.**
- **No theoretical essay lessons or textbook reproduction.**
- **No Learning Management System (LMS) functionality.**
- **No student user accounts, authentication, or cloud database.**
- **No question banks, quizzes, assignments, or grading engines.**
- **No AI tutoring or backend microservices.**

### Role of Curriculum Documentation
Official Nepal CDC curriculum specifications (`docs/curriculum/`) serve strictly as an **internal engineering and development reference** to identify chapters, verify academic accuracy, and map simulation opportunities. The application runtime maintains only concise chapter metadata (grade, chapter number, official title, content area, simulation IDs, and status) sufficient for navigation and launching simulations.

---

## Status

**Version 0.2.0** — Simple Harmonic Motion & Regression Freeze (Verified on Physical Android Hardware).

| Component | Status |
|-----------|--------|
| Simulation engine (TypeScript) | ✅ Working (SimulationRegistry, Vector2, SimulationClock, Camera2D, CanvasRenderer, Graph) |
| Projectile Motion simulation | ✅ Working (offline font stack, relative asset paths, idempotent loop, 90° robust sampling) |
| Newton's Second Law simulation | ✅ Working (F_net = m*a, static/kinetic friction, dynamic camera, live verification) |
| Simple Harmonic Motion simulation | ✅ Working (4 modes: Free Spring & Pendulum, Damped, Forced, Resonance A(Ω) curve) |
| Core, Physics & Rendering unit tests | ✅ 160 tests passing across 9 suites (Vector2, Clock, Camera2D, Registry, Projectile, Newton, Curriculum, SHM, SHM Rendering) |
| Web build (Vite + TS) | ✅ Builds with relative paths (`./assets/...`) (92.8 KB bundle) |
| Desktop browser development | ✅ Working with URL hash routing (`#projectile-motion`, `#newtons-second-law`, `#simple-harmonic-motion`) |
| Android shell (Kotlin/Compose) | ✅ Code complete (security hardened, dual D-pad/touch support, lifecycle managed) |
| WebView integration | ✅ Code complete with `WebViewAssetLoader`, CORS headers, and MIME mappings |
| Gradle build configuration | ✅ Memory tuned for host (`-Xmx1024m -XX:+UseSerialGC`, Gradle 9.6.1 + AGP 9.4.0) |
| APK build | ✅ Working (`android/app/build/outputs/apk/debug/app-debug.apk`) |
| Samsung Galaxy S21 FE testing | ✅ Verified on physical hardware (`[ANDROID-TEST-DEVICE]`, Android 16 / One UI 8.0) |
| High-DPI Canvas scaling | ✅ Verified with DPR compensation (`ctx.scale(dpr, dpr)` & `ResizeObserver`) |
| Physical Android TV testing | ⏳ Pending: Awaiting physical TV hardware & physical remote testing in classroom |
| Testing reports | ✅ Documented in [docs/testing/first-vertical-slice.md](docs/testing/first-vertical-slice.md) and [docs/testing/shm-milestone-freeze.md](docs/testing/shm-milestone-freeze.md) |

## Prerequisites & Environment Setup

### For simulation development (web only)

- **Node.js** 20+ and npm
- Runs offline with zero external network requests (system font stack)

### For Android APK builds

| Requirement | Notes |
|------------|-------|
| JDK 17+ | Standard JDK 17, 21, or 25. Set `JAVA_HOME` in your environment. |
| Android SDK | Platform API 37 (`platforms;android-37`). Set `ANDROID_HOME` or `ANDROID_SDK_ROOT`. |
| Build Tools | 36.0.0 (`build-tools;36.0.0`). |
| Gradle user home / cache | Optional: Set `GRADLE_USER_HOME` to control cache directory location. |

**Environment setup (PowerShell):**

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"  # Adjust to your JDK installation path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"  # Adjust to your SDK path
```

**Machine-specific `local.properties`:**
Do not commit `local.properties` (it is gitignored). You can copy `android/local.properties.example` to `android/local.properties` and configure your local SDK path:
```properties
sdk.dir=C\:\\Users\\<YourUser>\\AppData\\Local\\Android\\Sdk
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
│   │   │   ├── Simulation.ts
│   │   │   └── SimulationRegistry.ts
│   │   ├── physics/            # Pure math models
│   │   │   ├── ProjectilePhysics.ts
│   │   │   └── NewtonsSecondLawPhysics.ts
│   │   ├── rendering/          # Canvas drawing
│   │   │   └── CanvasRenderer.ts
│   │   ├── components/         # UI components
│   │   │   └── Graph.ts
│   │   ├── simulations/        # Individual simulations
│   │   │   ├── projectile-motion/
│   │   │   │   └── ProjectileMotionSimulation.ts
│   │   │   └── newtons-second-law/
│   │   │       └── NewtonsSecondLawSimulation.ts
│   │   └── main.ts
│   ├── tests/
│   │   ├── core/
│   │   │   ├── vector2.test.ts
│   │   │   ├── clock.test.ts
│   │   │   ├── camera2d.test.ts
│   │   │   └── registry.test.ts
│   │   └── physics/
│   │       ├── projectile.test.ts
│   │       └── newton.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── index.html
│
├── docs/
│   ├── architecture.md
│   ├── curriculum-map.md
│   ├── simulation-specs/
│   │   ├── projectile-motion.md
│   │   └── newtons-second-law.md
│   └── testing/
│       └── first-vertical-slice.md
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

This project is licensed under the [MIT License](LICENSE).

# build-all.ps1
# Full build pipeline: web → copy assets → Android APK
#
# Usage: .\scripts\build-all.ps1
# Run from the repository root (D:\Public High school)
#
# Prerequisites:
#   - Node.js and npm installed
#   - JAVA_HOME set to JDK 17 (e.g., D:\jdk-17)
#   - ANDROID_HOME set to Android SDK (e.g., D:\Android\Sdk)
#   - GRADLE_USER_HOME set to Gradle cache location (e.g., D:\Gradle)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== Physics Lab — Full Build ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build simulation-web
Write-Host "Step 1: Building simulation-web..." -ForegroundColor Yellow
Push-Location (Join-Path $repoRoot "simulation-web")
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
    Write-Host "  Web build succeeded." -ForegroundColor Green
} finally {
    Pop-Location
}
Write-Host ""

# Step 2: Run tests
Write-Host "Step 2: Running tests..." -ForegroundColor Yellow
Push-Location (Join-Path $repoRoot "simulation-web")
try {
    npm test
    if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    Write-Host "  All tests passed." -ForegroundColor Green
} finally {
    Pop-Location
}
Write-Host ""

# Step 3: Copy web assets to Android
Write-Host "Step 3: Copying web assets to Android..." -ForegroundColor Yellow
& (Join-Path (Join-Path $repoRoot "scripts") "copy-web-assets.ps1")
Write-Host ""

# Step 4: Build Android APK
Write-Host "Step 4: Building Android APK..." -ForegroundColor Yellow
$androidDir = Join-Path $repoRoot "android"

# Check prerequisites
if (-not $env:JAVA_HOME) {
    Write-Warning "JAVA_HOME not set. Set it to JDK 17 (e.g., D:\jdk-17)"
}
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    Write-Warning "ANDROID_HOME not set. Set it to Android SDK (e.g., D:\Android\Sdk)"
}
if (-not $env:GRADLE_USER_HOME) {
    Write-Warning "GRADLE_USER_HOME not set. Consider setting to D:\Gradle to keep caches on D:"
}

Push-Location $androidDir
try {
    if (Test-Path "gradlew.bat") {
        .\gradlew.bat assembleDebug
    } else {
        Write-Warning "Gradle wrapper not found. Run 'gradle wrapper' in android/ first."
        Write-Warning "Or download gradlew from: https://services.gradle.org/distributions/"
        exit 1
    }
    if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
    Write-Host "  Android build succeeded." -ForegroundColor Green

    $apk = Join-Path (Join-Path (Join-Path (Join-Path (Join-Path (Join-Path $androidDir "app") "build") "outputs") "apk") "debug") "app-debug.apk"
    if (Test-Path $apk) {
        $size = [math]::Round((Get-Item $apk).Length / 1024 / 1024, 1)
        Write-Host "  APK: $apk ($size MB)" -ForegroundColor Cyan
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Green

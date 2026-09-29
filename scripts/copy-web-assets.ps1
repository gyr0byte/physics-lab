# copy-web-assets.ps1
# Copies the simulation-web build output into Android app assets.
#
# Usage: .\scripts\copy-web-assets.ps1
# Run from the repository root (D:\Public High school)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$webDist = Join-Path (Join-Path $repoRoot "simulation-web") "dist"
$androidAssets = Join-Path (Join-Path (Join-Path (Join-Path (Join-Path $repoRoot "android") "app") "src") "main") "assets"
$androidAssets = Join-Path $androidAssets "simulation-web"

# Verify web build output exists
if (-not (Test-Path $webDist)) {
    Write-Error "Web build output not found at: $webDist`nRun 'npm run build' in simulation-web/ first."
    exit 1
}

# Remove old assets
if (Test-Path $androidAssets) {
    Remove-Item -Recurse -Force $androidAssets
    Write-Host "Removed old assets at: $androidAssets"
}

# Copy new assets
Copy-Item -Recurse $webDist $androidAssets
Write-Host "Copied web build output:"
Write-Host "  From: $webDist"
Write-Host "  To:   $androidAssets"

# List copied files
$files = Get-ChildItem -Recurse $androidAssets -File
Write-Host "`nCopied $($files.Count) file(s):"
foreach ($f in $files) {
    $rel = $f.FullName.Replace($androidAssets, "")
    $size = [math]::Round($f.Length / 1024, 1)
    Write-Host "  $rel ($size KB)"
}

Write-Host "`nDone. Web assets are ready for Android build."

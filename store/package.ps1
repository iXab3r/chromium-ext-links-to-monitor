# Builds the store upload package: dist/external-links-to-monitor-<version>.zip
# Contains only the files the extension needs at runtime.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json).version
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $dist | Out-Null
$zip = Join-Path $dist "external-links-to-monitor-$version.zip"
if (Test-Path $zip) { Remove-Item $zip }

# Built by hand rather than with Compress-Archive: older versions of it write
# backslashes into entry names, which the stores reject.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$files = @('manifest.json', 'background.js') + (Get-ChildItem (Join-Path $root 'icons') -Filter *.png |
  ForEach-Object { "icons/$($_.Name)" })
$archive = [IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  foreach ($f in $files) {
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $root $f), $f, 'Optimal')
  }
} finally { $archive.Dispose() }
Write-Host $zip

# Renders the store images (store/*.png) from the HTML sources next to this script
# (plus the 128px extension icon) using headless Microsoft Edge. Run from anywhere:  pwsh store/assets-src/render.ps1
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$out = Split-Path $src -Parent
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
          "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'msedge.exe not found' }
$profile = Join-Path ([IO.Path]::GetTempPath()) "links-to-monitor-render"

$jobs = @(
  @{ html = 'screenshot-1-before.html'; png = 'screenshot-1-before.png'; w = 1280; h = 800 },
  @{ html = 'screenshot-2-after.html';  png = 'screenshot-2-after.png';  w = 1280; h = 800 },
  @{ html = 'screenshot-3-menu.html';   png = 'screenshot-3-menu.png';   w = 1280; h = 800 },
  @{ html = 'promo-small.html';         png = 'promo-small-440x280.png'; w = 440;  h = 280 },
  @{ html = 'logo.html';                png = 'logo-300.png';            w = 300;  h = 300 },
  @{ html = 'icon128.html';             png = '..\icons\128.png';        w = 128;  h = 128; transparent = $true }
)
foreach ($j in $jobs) {
  $url = ([Uri](Join-Path $src $j.html)).AbsoluteUri
  $png = Join-Path $out $j.png
  $bg = if ($j.transparent) { '--default-background-color=00000000' } else { '--default-background-color=ffffffff' }
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 $bg `
    "--user-data-dir=$profile" "--window-size=$($j.w),$($j.h)" "--screenshot=$png" $url 2>$null | Out-Null
  Write-Host "$($j.png)"
}

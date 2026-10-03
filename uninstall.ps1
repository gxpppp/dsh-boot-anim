[CmdletBinding()]
param(
  [string]$ProfileDir = ''
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProfileDir)) { $ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop' }

$pkgName = '@local/dsh-boot-anim'
$pkgJson = Join-Path $ProfileDir 'package.json'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

if (-not (Test-Path $pkgJson)) { throw "Profile package.json not found: $pkgJson" }

$json = [System.IO.File]::ReadAllText($pkgJson) | ConvertFrom-Json
$json.dependencies.PSObject.Properties.Remove($pkgName)
$json.dsh.profile.bundles = @($json.dsh.profile.bundles | Where-Object { $_ -ne $pkgName })
[System.IO.File]::WriteAllText($pkgJson, ($json | ConvertTo-Json -Depth 12), $utf8NoBom)

$b = [System.IO.File]::ReadAllBytes($pkgJson)
if ($b[0] -eq 239) { throw "Wrote a BOM into $pkgJson - aborting" }

$linkPath = Join-Path $ProfileDir 'node_modules\@local\dsh-boot-anim'
if (Test-Path $linkPath) { (Get-Item $linkPath -Force).Delete() }

Write-Host "Uninstalled. Restart the desktop app to take effect." -ForegroundColor Green

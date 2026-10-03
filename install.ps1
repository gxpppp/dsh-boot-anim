[CmdletBinding()]
param(
  [string]$PluginDir = '',
  [string]$ProfileDir = ''
)

# DSH desktop profile 安装器。所有路径均可参数化，默认值从脚本自身位置与环境推导。
#
# 关键：profile 的 package.json 必须是 UTF-8 *无 BOM*。
# PowerShell 5.1 的 Set-Content -Encoding UTF8 会写 BOM，BOM 会让 Node 的
# JSON.parse 直接抛 Unexpected token，因此这里一律用 WriteAllText + UTF8Encoding($false)。

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($PluginDir)) { $PluginDir = $PSScriptRoot }
if ([string]::IsNullOrWhiteSpace($ProfileDir)) { $ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop' }

$pkgName = '@local/dsh-boot-anim'
$pkgJson = Join-Path $ProfileDir 'package.json'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

Write-Host "[1/5] PluginDir  = $PluginDir"
Write-Host "      ProfileDir = $ProfileDir"
if (-not (Test-Path $pkgJson)) { throw "Profile package.json not found: $pkgJson" }
if (-not (Test-Path (Join-Path $PluginDir 'lib\index.js'))) { throw "Plugin entry not found: $PluginDir" }

$bak = "$pkgJson.bak-boot-anim"
if (-not (Test-Path $bak)) {
  [System.IO.File]::WriteAllText($bak, [System.IO.File]::ReadAllText($pkgJson), $utf8NoBom)
  Write-Host "[2/5] Backed up -> $bak"
} else {
  Write-Host "[2/5] Backup already exists, kept: $bak"
}

$json = [System.IO.File]::ReadAllText($pkgJson) | ConvertFrom-Json
$depValue = 'link:' + ($PluginDir -replace '\\', '/')

if ($json.dependencies.PSObject.Properties.Name -contains $pkgName) {
  Write-Host "[3/5] dependencies already has $pkgName"
} else {
  $json.dependencies | Add-Member -NotePropertyName $pkgName -NotePropertyValue $depValue -Force
  Write-Host "[3/5] dependencies += $pkgName -> $depValue"
}

$bundles = @($json.dsh.profile.bundles)
if ($bundles -contains $pkgName) {
  Write-Host "[4/5] bundles already has $pkgName"
} else {
  $json.dsh.profile.bundles = @($bundles + $pkgName)
  Write-Host "[4/5] bundles += $pkgName (now $($json.dsh.profile.bundles.Count) entries)"
}

[System.IO.File]::WriteAllText($pkgJson, ($json | ConvertTo-Json -Depth 12), $utf8NoBom)

$b = [System.IO.File]::ReadAllBytes($pkgJson)
if ($b[0] -eq 239) { throw "Wrote a BOM into $pkgJson - aborting" }
Write-Host "      package.json written (UTF-8 no BOM, $($b.Length) bytes)"

$scopeDir = Join-Path $ProfileDir 'node_modules\@local'
if (-not (Test-Path $scopeDir)) { New-Item -ItemType Directory -Path $scopeDir -Force | Out-Null }
$linkPath = Join-Path $scopeDir 'dsh-boot-anim'
if (Test-Path $linkPath) { (Get-Item $linkPath -Force).Delete() }
New-Item -ItemType Junction -Path $linkPath -Target $PluginDir | Out-Null
Write-Host "[5/5] Junction -> $linkPath"

Write-Host ""
Write-Host "Done. Restart the DeepSeek Harness desktop app." -ForegroundColor Green

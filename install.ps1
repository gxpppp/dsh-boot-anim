[CmdletBinding()]
param(
  [string]$PluginDir = '',
  [string]$ProfileDir = ''
)

# dsh-boot-anim 安装器 —— 手工装配版。
#
# 优先考虑官方途径（一条命令，无需本脚本）：
#   dsh plugin --profile desktop add github:gxpppp/dsh-boot-anim
#
# 本脚本适用于两种官方途径做不到的场景：
#   1. 从本地工作目录安装（改完代码立即生效，不必 commit/push）；
#   2. 网络受限、pnpm 拉不到 GitHub 时。
#
# 三处改动与 pnpm 安装等价：dependencies 加 link: 依赖 → bundles 追加包名 → 建 junction。
# 关键：包名必须与 package.json 的 name 一致（dsh-boot-anim），否则加载器的
# resolveBundleDir() 找不到包，会静默跳过（界面无任何提示）。
#
# 另：profile 的 package.json 必须是 UTF-8 无 BOM。PowerShell 5.1 的
# Set-Content -Encoding UTF8 会写 BOM，BOM 会让 Node 的 JSON.parse 抛错、
# 导致桌面版读不出 profile。故一律用 WriteAllText + UTF8Encoding($false)。

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($PluginDir)) { $PluginDir = $PSScriptRoot }
if ([string]::IsNullOrWhiteSpace($ProfileDir)) { $ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop' }

$pkgName = 'dsh-boot-anim'
$pkgJson = Join-Path $ProfileDir 'package.json'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

Write-Host "[1/5] PluginDir  = $PluginDir"
Write-Host "      ProfileDir = $ProfileDir"
if (-not (Test-Path $pkgJson)) { throw "Profile package.json not found: $pkgJson" }
if (-not (Test-Path (Join-Path $PluginDir 'lib\index.js'))) { throw "Plugin entry not found: $PluginDir" }

# 旧包名清理：早期版本叫 @local/dsh-boot-anim，迁移时一并移除，避免残留条目
$legacy = '@local/dsh-boot-anim'
# 先备份，再在同一个对象上做全部改动 —— 
# 早期版本这里重读了一次 JSON，把「已移除旧包名」的结果覆盖了，导致旧名残留。
$bak = "$pkgJson.bak-boot-anim"
if (-not (Test-Path $bak)) {
  [System.IO.File]::WriteAllText($bak, [System.IO.File]::ReadAllText($pkgJson), $utf8NoBom)
  Write-Host "[2/5] Backed up -> $bak"
} else {
  Write-Host "[2/5] Backup already exists, kept: $bak"
}

$json = [System.IO.File]::ReadAllText($pkgJson) | ConvertFrom-Json
if ($json.dependencies.PSObject.Properties.Name -contains $legacy) {
  $json.dependencies.PSObject.Properties.Remove($legacy)
  $json.dsh.profile.bundles = @($json.dsh.profile.bundles | Where-Object { $_ -ne $legacy })
  Write-Host "[2.5] 已移除旧包名 $legacy"
}
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

# 写后自检：BOM 会让 Node 的 JSON.parse 失败，直接中止而非留下坏文件
$b = [System.IO.File]::ReadAllBytes($pkgJson)
if ($b[0] -eq 239) { throw "Wrote a BOM into $pkgJson - aborting" }
Write-Host "      package.json written (UTF-8 no BOM, $($b.Length) bytes)"

$scopeDir = Join-Path $ProfileDir 'node_modules'
if (-not (Test-Path $scopeDir)) { New-Item -ItemType Directory -Path $scopeDir -Force | Out-Null }
$linkPath = Join-Path $scopeDir $pkgName
if (Test-Path $linkPath) { (Get-Item $linkPath -Force).Delete() }
New-Item -ItemType Junction -Path $linkPath -Target $PluginDir | Out-Null
Write-Host "[5/5] Junction -> $linkPath"

Write-Host ""
Write-Host "Done. Restart the DeepSeek Harness desktop app." -ForegroundColor Green

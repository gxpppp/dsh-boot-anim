[CmdletBinding()]
param(
  [string]$PlaywrightEntry = ''
)

# 无头复现分镜（Chromium + 真实 CSS/JS）。不需要重启桌面版。
# Playwright 解析：-PlaywrightEntry > DSH_PLAYWRIGHT 环境变量 > 当前目录下的 node_modules。

$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $dir '_verify\run.mjs'
if (-not (Test-Path $runner)) { throw "Runner not found: $runner" }

if (-not [string]::IsNullOrWhiteSpace($PlaywrightEntry)) { $env:DSH_PLAYWRIGHT = $PlaywrightEntry }

$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) { throw "找不到 node，请先安装 Node.js 并加入 PATH" }

& $node.Source $runner
Write-Host ""
Write-Host "逐帧截图已写入 _verify\f*.png" -ForegroundColor Green

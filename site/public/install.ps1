# Navego - one-command install for Windows, per user, no administrator.
# @last-edited: 2026-11-24 UTC+7.
# @title: install.ps1 - fetches nothing and writes one policy value per Chromium browser, at the first free number.
# @state: the browser downloads the signed CRX from the update URL itself; this script only tells it to, and says what it cost.
# @dependencies: Windows PowerShell 5.1+, HKCU write access, one browser restart.
# WHAT IT DOES NOT DO: it does not download the extension, does not start it, and does not touch a machine-wide policy.
# The browser reads ExtensionInstallForcelist under HKCU at start, fetches the signed CRX from the update URL, and keeps it updated.
# WHAT IT COSTS YOU: the browser then reports itself as managed by your organization (it is your own registry), and the extension cannot be removed from chrome://extensions while the policy stands.
# A machine run by an administrator keeps the administrator's answer: an HKCU write is refused or overridden there, and this script does not try to win that.

param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$ExtensionId = 'ofgemipoobcnbjkfanmofjbdonjapmgl'
$UpdateUrl = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl'
$Value = "$ExtensionId;$UpdateUrl"

$PolicyKeys = @(
  'HKCU:\Software\Policies\Google\Chrome\ExtensionInstallForcelist',
  'HKCU:\Software\Policies\Microsoft\Edge\ExtensionInstallForcelist',
  'HKCU:\Software\Policies\BraveSoftware\Brave-Browser\ExtensionInstallForcelist',
  'HKCU:\Software\Policies\Vivaldi\ExtensionInstallForcelist',
  'HKCU:\Software\Policies\Opera Software\Opera\ExtensionInstallForcelist'
)

function Get-NextFreeIndex {
  param([string]$Key)
  if (-not (Test-Path $Key)) { return 1 }
  $names = (Get-Item $Key).Property | Where-Object { $_ -match '^\d+$' }
  if (-not $names) { return 1 }
  $highest = ($names | ForEach-Object { [int]$_ } | Measure-Object -Maximum).Maximum
  return ($highest + 1)
}

function Find-OurIndex {
  param([string]$Key)
  if (-not (Test-Path $Key)) { return $null }
  $item = Get-Item $Key
  foreach ($name in $item.Property) {
    if ($name -match '^\d+$' -and (Get-ItemPropertyValue -Path $Key -Name $name) -like "$ExtensionId;*") { return $name }
  }
  return $null
}

$written = @()
foreach ($key in $PolicyKeys) {
  $existing = Find-OurIndex -Key $key
  if ($existing) {
    Write-Output "= $key -> already at value '$existing', left alone"
    continue
  }
  $index = Get-NextFreeIndex -Key $key
  if ($DryRun) {
    Write-Output "+ $key -> would write '$index' (dry run, nothing changed)"
    continue
  }
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name "$index" -Value $Value -PropertyType String -Force | Out-Null
  $written += "$key -> $index"
  Write-Output "+ $key -> wrote '$index'"
}

Write-Output ''
if ($DryRun) {
  Write-Output 'Dry run finished. Nothing was written. Re-run without -DryRun to install.'
  exit 0
}
if ($written.Count -eq 0) {
  Write-Output 'Nothing to write: the policy already carries this extension. Restart the browser if it is not in chrome://extensions yet.'
  exit 0
}
Write-Output 'Restart every browser you just touched. The extension appears in chrome://extensions, enabled, and cannot be removed while this policy stands.'
Write-Output "It is signed and self-updating from: $UpdateUrl"
Write-Output "To undo: delete the values named above under HKCU, or run 'navego uninstall' from the npm package."
Write-Output 'Then sign in at https://navego.pages.dev/ and pair this browser from the dashboard.'

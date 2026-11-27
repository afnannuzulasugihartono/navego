# Runs a superpowers bash script with the Git for Windows bash installed on this machine.
# PowerShell stays the OpenCode shell, so existing automations are untouched.

param(
    [Parameter(Mandatory = $true)][string] $Script,
    [string[]] $Arguments = @()
)

$bash = 'C:\Program Files\Git\bin\bash.exe'
if (-not (Test-Path $bash)) {
    throw "Git Bash not found at $bash"
}
if (-not (Test-Path $Script)) {
    throw "Script not found: $Script"
}
& $bash $Script @Arguments
exit $LASTEXITCODE

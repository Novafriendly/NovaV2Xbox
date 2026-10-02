# Run locally. Password entry is hidden and never written to disk.
$ErrorActionPreference = 'Stop'
$novaRecoveryUid = 'q99CRq78vcgR8Uxg9TMHEyuq1aE3'
$novaRecoveryScript = Join-Path $PSScriptRoot 'reset-nova-password.mjs'
$novaRecoveryKeyPath = ''
if (-not $env:FIREBASE_SERVICE_ACCOUNT_JSON) {
 Write-Host 'Choose the Firebase service-account JSON file for nova-chat-43a18. Keep it outside the website repository.'
 $novaRecoveryKeyPath = (Read-Host 'Full path to the JSON file').Trim().Trim('"')
 if (-not (Test-Path -LiteralPath $novaRecoveryKeyPath -PathType Leaf)) { throw 'JSON file not found.' }
}
function Invoke-NovaRecovery($mode, $payload) {
 $novaStart = New-Object System.Diagnostics.ProcessStartInfo
 $novaStart.FileName = (Get-Command node -ErrorAction Stop).Source
 $novaStart.Arguments = '"' + $novaRecoveryScript + '" ' + $mode
 $novaStart.UseShellExecute = $false
 $novaStart.CreateNoWindow = $true
 $novaStart.RedirectStandardInput = $true
 $novaStart.RedirectStandardOutput = $true
 $novaStart.RedirectStandardError = $true
 $novaProcess = New-Object System.Diagnostics.Process
 $novaProcess.StartInfo = $novaStart
 [void]$novaProcess.Start()
 $novaProcess.StandardInput.Write(($payload | ConvertTo-Json -Compress))
 $novaProcess.StandardInput.Close()
 $novaResult = $novaProcess.StandardOutput.ReadToEnd()
 $novaFailure = $novaProcess.StandardError.ReadToEnd()
 $novaProcess.WaitForExit()
 if ($novaProcess.ExitCode -ne 0) { $novaProcess.Dispose(); throw $novaFailure }
 $novaProcess.Dispose()
 return ($novaResult | ConvertFrom-Json)
}
$novaRecoveryProfile = Invoke-NovaRecovery '--inspect' @{credentialPath=$novaRecoveryKeyPath}
Write-Host "Account UID: $($novaRecoveryProfile.uid)"
Write-Host "Account email: $($novaRecoveryProfile.email)"
Write-Host "Account name: $($novaRecoveryProfile.name)"
Write-Host 'This changes only this account and signs out its other sessions.'
if ((Read-Host 'Type RESET to continue') -cne 'RESET') { Write-Host 'Cancelled. No password changed.'; return }
$novaSecretOne = Read-Host 'New password (at least 8 characters)' -AsSecureString
$novaSecretTwo = Read-Host 'Confirm new password' -AsSecureString
$novaPtrOne = [IntPtr]::Zero
$novaPtrTwo = [IntPtr]::Zero
try {
 $novaPtrOne = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($novaSecretOne)
 $novaPtrTwo = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($novaSecretTwo)
 $novaPasswordOne = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($novaPtrOne)
 $novaPasswordTwo = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($novaPtrTwo)
 if ($novaPasswordOne -cne $novaPasswordTwo) { throw 'Passwords do not match. Nothing changed.' }
 if ($novaPasswordOne.Length -lt 8) { throw 'Use at least 8 characters. Nothing changed.' }
 $novaRecoveryResult = Invoke-NovaRecovery '--reset' @{credentialPath=$novaRecoveryKeyPath;confirmUid=$novaRecoveryUid;password=$novaPasswordOne}
 if ($novaRecoveryResult.ok) { Write-Host 'Password changed. Log into Nova using your new password.' }
 if (-not $novaRecoveryResult.sessionsRevoked) { Write-Warning 'Password changed, but existing sessions could not be revoked. Retry session revocation in Firebase.' }
} finally {
 if ($novaPtrOne -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($novaPtrOne) }
 if ($novaPtrTwo -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($novaPtrTwo) }
 $novaPasswordOne = $null
 $novaPasswordTwo = $null
 $novaSecretOne.Dispose()
 $novaSecretTwo.Dispose()
}

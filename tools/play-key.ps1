# The Play UPLOAD key on Windows -- the PowerShell twin of play-key.sh.
# Made once, put where CI reads it (the four repository secrets), never in the
# tree, a seed, a session or a log (landmine 23, RUNBOOK-play §2).
#
# In PowerShell, from the seed folder:
#     powershell -ExecutionPolicy Bypass -File tools\play-key.ps1
# or, if scripts are allowed already:
#     .\tools\play-key.ps1
#
# Needs keytool from any JDK (Temurin from adoptium.net, or Android Studio's
# bundled one -- both are looked for below). With the GitHub CLI logged in
# (winget install GitHub.cli; gh auth login) it sets the four secrets itself;
# without it, it prints the four values to paste.
#
# It refuses to overwrite an existing key: a second upload key is a second
# registration with Play, and the first is the one Play knows.
param([string]$Dir = (Join-Path $HOME 'optcghub-play-key'))
$ErrorActionPreference = 'Stop'
# Windows PowerShell 5.1 turns a native program's stderr into a terminating
# error under 'Stop'; keytool and gh both write warnings there. Native calls
# go through this, which relaxes the preference for the call only.
function Invoke-Native([string]$exe, [string[]]$argv) {
  $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { $out = & $exe @argv 2>&1 | Out-String; return @{ code = $LASTEXITCODE; out = $out } }
  finally { $ErrorActionPreference = $eap }
}
$Repo  = 'SergeantCS2/optcghub'
$Alias = 'optcghub-upload'

# keytool: on PATH, JAVA_HOME, Android Studio's JBR, or an Adoptium install
$candidates = @('keytool')
if ($env:JAVA_HOME) { $candidates += (Join-Path $env:JAVA_HOME 'bin\keytool.exe') }
$candidates += 'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe'
$candidates += Get-ChildItem 'C:\Program Files\Eclipse Adoptium\*\bin\keytool.exe' -ErrorAction SilentlyContinue | ForEach-Object FullName
$candidates += Get-ChildItem 'C:\Program Files\Java\*\bin\keytool.exe' -ErrorAction SilentlyContinue | ForEach-Object FullName
$KT = $null
foreach ($c in $candidates) { if (Get-Command $c -ErrorAction SilentlyContinue) { $KT = (Get-Command $c).Source; break } }
if (-not $KT) {
  Write-Host 'keytool not found. Install a JDK: adoptium.net -> Temurin 21 (LTS) -> .msi, tick "Set JAVA_HOME", then reopen PowerShell and run this again.'
  exit 1
}

New-Item -ItemType Directory -Force -Path $Dir | Out-Null
$jks = Join-Path $Dir 'upload.jks'
$pwf = Join-Path $Dir 'password.txt'
if (Test-Path $jks) {
  Write-Host "an upload key already exists at $jks -- keeping it (see the header)"
} else {
  $bytes = New-Object byte[] 24; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $Pass = ([Convert]::ToBase64String($bytes) -replace '[/+=]', 'x')
  $r = Invoke-Native $KT @('-genkeypair', '-keystore', $jks, '-storetype', 'PKCS12', '-alias', $Alias, '-keyalg', 'RSA', '-keysize', '2048', '-validity', '9125',
                           '-storepass', $Pass, '-keypass', $Pass, '-dname', 'CN=OP TCG Hub upload, OU=play, O=OP TCG Hub')
  if ($r.code -ne 0 -or -not (Test-Path $jks)) { Write-Host "keytool did not make the keystore:`n$($r.out)"; exit 1 }
  [IO.File]::WriteAllText($pwf, $Pass)
  Write-Host "made $jks (alias $Alias, 25 years)"
}
$Pass = [IO.File]::ReadAllText($pwf).Trim()

# Read it back before trusting it (AGENTS rule 2): the alias must be listed.
$listing = (Invoke-Native $KT @('-list', '-keystore', $jks, '-storepass', $Pass)).out
if ($listing -notmatch [regex]::Escape($Alias)) { Write-Host "the keystore does not list alias $Alias -- wrong password.txt or a damaged file"; exit 1 }
$fp = ((Invoke-Native $KT @('-list', '-v', '-keystore', $jks, '-storepass', $Pass, '-alias', $Alias)).out -split "`n" | Where-Object { $_ -match 'SHA256:' } | Select-Object -First 1).Trim()
Write-Host "upload key fingerprint  $fp"

# One line of base64: what the secret holds and what ci/apk.sh decodes.
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jks))
$b64f = Join-Path $Dir 'upload.b64'
[IO.File]::WriteAllText($b64f, $b64)

$gh = Get-Command gh -ErrorAction SilentlyContinue
$loggedIn = $false
if ($gh) { $loggedIn = ((Invoke-Native 'gh' @('auth', 'status')).code -eq 0) }
if ($loggedIn) {
  $b64 | & gh secret set PLAY_UPLOAD_KEYSTORE_B64 --repo $Repo
  & gh secret set PLAY_UPLOAD_STORE_PASS --repo $Repo --body $Pass
  & gh secret set PLAY_UPLOAD_KEY_ALIAS  --repo $Repo --body $Alias
  & gh secret set PLAY_UPLOAD_KEY_PASS   --repo $Repo --body $Pass
  Write-Host "four secrets set on ${Repo}:"; & gh secret list --repo $Repo
  Write-Host 'next: Actions -> build -> Run workflow. The release''s .aab loses its DEVKEY-DO-NOT-UPLOAD suffix.'
} else {
  Write-Host ''
  Write-Host 'GitHub CLI is not logged in (winget install GitHub.cli; gh auth login), so set the four secrets by hand:'
  Write-Host "  github.com/$Repo -> Settings -> Secrets and variables -> Actions -> New repository secret"
  Write-Host ''
  Write-Host "  PLAY_UPLOAD_KEYSTORE_B64   the ONE line in  $b64f   (notepad it, Ctrl+A, Ctrl+C)"
  Write-Host "  PLAY_UPLOAD_STORE_PASS     $Pass"
  Write-Host "  PLAY_UPLOAD_KEY_ALIAS      $Alias"
  Write-Host "  PLAY_UPLOAD_KEY_PASS       $Pass"
  Write-Host ''
  Write-Host 'then Actions -> build -> Run workflow; the release''s .aab loses its DEVKEY-DO-NOT-UPLOAD suffix.'
}
Write-Host ''
Write-Host "Back up the folder $Dir somewhere that is not this PC. Never commit it -- .gitignore refuses *upload*.jks and *upload*.b64, and the gate refuses a tree that carries one."

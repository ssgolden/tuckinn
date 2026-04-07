$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
Set-Location $projectRoot

if (Test-Path "apps\staff\.env.local") {
  Get-Content "apps\staff\.env.local" | ForEach-Object {
    if ($_ -match "^(?!#)([^=]+)=(.*)$") {
      Set-Item -Path ("Env:" + $matches[1]) -Value $matches[2]
    }
  }
}

& "C:\Program Files\nodejs\pnpm.CMD" --filter @tuckinn/staff dev

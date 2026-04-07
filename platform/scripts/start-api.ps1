$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
$apiRoot = Join-Path $projectRoot "apps\api"
$apiLog = Join-Path $apiRoot "api-3200.log"
$apiErrLog = Join-Path $apiRoot "api-3200.err.log"

Set-Location $projectRoot

$listener = Get-NetTCPConnection -LocalPort 3200 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $processIds = $listener | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force
  }
}

& "C:\Program Files\nodejs\pnpm.CMD" --filter @tuckinn/api build

Start-Process -FilePath "powershell.exe" `
  -WorkingDirectory $apiRoot `
  -ArgumentList @(
    "-NoProfile",
    "-Command",
    "Set-Location -LiteralPath '$apiRoot'; node dist/main.js *> '$apiLog' 2> '$apiErrLog'"
  )

Start-Sleep -Seconds 6

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3200/api/health" -UseBasicParsing -TimeoutSec 15
  Write-Output ("API started on http://localhost:3200 with status " + $response.StatusCode)
} catch {
  Write-Output "API did not answer on port 3200. Check the logs:"
  Write-Output $apiLog
  Write-Output $apiErrLog
  throw
}

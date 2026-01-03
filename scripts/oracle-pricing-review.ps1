param(
  [string]$RepoRoot = $(Resolve-Path "$PSScriptRoot\..")
)

$ErrorActionPreference = 'Stop'

Set-Location $RepoRoot

$alertPath = $env:JANUS_ALERT_LOG_PATH
if (-not $alertPath) {
  $alertPath = Join-Path (Split-Path -Parent $RepoRoot) 'janus-alerts.log'
}

$modelsPath = Join-Path $RepoRoot 'janus-context\state\models.json'
$outputPath = Join-Path $env:TEMP ("janus-openrouter-review-{0}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$statusPath = Join-Path $RepoRoot 'janus-context\state\oracle-pricing-review.json'
$alertsJsonl = Join-Path $RepoRoot 'janus-context\state\alerts.jsonl'

$timeoutSeconds = $env:JANUS_ORACLE_TIMEOUT_SECONDS
if (-not $timeoutSeconds) {
  $timeoutSeconds = '120'
}

$slug = "janus-openrouter-review-$([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))"

$prompt = @'
You are advising on pricing sources for the Janus model catalog.
Answer JSON only with this schema:
{
  "bestIdea": true|false,
  "rationale": "<short reason>",
  "alternative": "<if false, name the better source>"
}
Question: Is OpenRouter still the best idea for machine-readable pricing updates?
If not, name the better option and why.
'@

$oracleArgs = @(
  '--wait',
  '--slug', $slug,
  '--prompt', $prompt,
  '--file', $modelsPath,
  '--write-output', $outputPath,
  '--timeout', $timeoutSeconds
)

if ($env:JANUS_ORACLE_MODEL) {
  $oracleArgs += @('--model', $env:JANUS_ORACLE_MODEL)
}

try {
  & oracle @oracleArgs | Out-Null
} catch {
  $message = "[oracle-pricing-review] Oracle failed: $($_.Exception.Message)"
  Add-Content -Path $alertPath -Value $message
  exit 1
}

if (-not (Test-Path $outputPath)) {
  $message = "[oracle-pricing-review] Oracle output missing at $outputPath"
  Add-Content -Path $alertPath -Value $message
  exit 1
}

$content = Get-Content -Path $outputPath -Raw
Remove-Item -Path $outputPath -ErrorAction SilentlyContinue

$match = [regex]::Match($content, '\{[\s\S]*\}')
if (-not $match.Success) {
  $message = '[oracle-pricing-review] Unable to parse JSON response.'
  Add-Content -Path $alertPath -Value $message
  exit 1
}

$data = $match.Value | ConvertFrom-Json
$timestamp = (Get-Date).ToUniversalTime().ToString('o')

$status = @{
  timestamp = $timestamp
  bestIdea = [bool]$data.bestIdea
  rationale = [string]$data.rationale
  alternative = [string]$data.alternative
}
($status | ConvertTo-Json -Depth 3) | Set-Content -Path $statusPath

if (-not $data.bestIdea) {
  $message = "[oracle-pricing-review] OpenRouter pricing may no longer be best. " +
    "Alternative: $($data.alternative). Reason: $($data.rationale)"
  Add-Content -Path $alertPath -Value $message

  $alertRecord = @{
    timestamp = $timestamp
    type = 'oracle-pricing-review'
    message = $message
  } | ConvertTo-Json -Compress
  Add-Content -Path $alertsJsonl -Value $alertRecord
}

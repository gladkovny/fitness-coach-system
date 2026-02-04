# Полуавтоматический commit + push для fitness-coach-system
# Использование: .\scripts\git-push.ps1
#            или .\scripts\git-push.ps1 "описание" (без выбора типа)
#            или .\scripts\git-push.ps1 -Type docs -Message "обновлён SYNC_STATUS"

param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$Message = "",
    [Parameter(Mandatory=$false)]
    [ValidateSet("feature","fix","docs","refactor","chore","")]
    [string]$Type = ""
)

$TYPES = @{}
$TYPES["1"] = @{ key = "feature";  label = "New feature";       prefix = "feature" }
$TYPES["2"] = @{ key = "fix";      label = "Bug fix";           prefix = "fix" }
$TYPES["3"] = @{ key = "docs";     label = "Documentation";     prefix = "docs" }
$TYPES["4"] = @{ key = "refactor"; label = "Refactoring";       prefix = "refactor" }
$TYPES["5"] = @{ key = "chore";    label = "Other (scripts, config)"; prefix = "chore" }

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$projectRoot\.git")) {
    Write-Host "Error: not a git repo root. Run from fitness-coach-system folder." -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

# Сбор сообщения коммита
if ($Message -and $Type) {
    $typePrefix = $Type
    $desc = $Message.Trim()
} elseif ($Message) {
    # Только сообщение — без префикса типа
    $typePrefix = ""
    $desc = $Message.Trim()
} else {
    # Интерактивный режим
    Write-Host "`n=== Change type ===" -ForegroundColor Cyan
    foreach ($k in ($TYPES.Keys | Sort-Object)) {
        $v = $TYPES[$k]
        Write-Host "  $k. [$($v.prefix)] $($v.label)"
    }
    $choice = Read-Host "`nChoice (1-5)"
    if (-not $TYPES.ContainsKey($choice)) {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    $typePrefix = $TYPES[$choice].prefix

    Write-Host "`nShort description (what was done):" -ForegroundColor Cyan
    $desc = Read-Host
    if (-not $desc) {
        Write-Host "No description. Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

$commitMsg = if ($typePrefix) { "[$typePrefix] $desc" } else { $desc }

Write-Host "`nAdding changes..." -ForegroundColor Cyan
git add .

$status = git status --short
if (-not $status) {
    Write-Host "Nothing to commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nChanged files:" -ForegroundColor Gray
$status | ForEach-Object { Write-Host "  $_" }
Write-Host "`nCommit: $commitMsg" -ForegroundColor Cyan
$confirm = Read-Host "Commit and push? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Сообщение через файл в UTF-8 — чтобы кириллица не искажалась на GitHub
$msgFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($msgFile, $commitMsg, [System.Text.UTF8Encoding]::new($false))
git commit -F $msgFile
Remove-Item $msgFile -Force -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed or cancelled." -ForegroundColor Red
    exit 1
}

Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. Try: git pull, then git push" -ForegroundColor Red
    exit 1
}

Write-Host "`nDone. Changes pushed to GitHub." -ForegroundColor Green

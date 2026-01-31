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

$TYPES = @{
    "1" = @{ key = "feature";  label = "Новая функция";     prefix = "feature" }
    "2" = @{ key = "fix";      label = "Исправление бага";  prefix = "fix" }
    "3" = @{ key = "docs";     label = "Документация";      prefix = "docs" }
    "4" = @{ key = "refactor"; label = "Рефакторинг";       prefix = "refactor" }
    "5" = @{ key = "chore";    label = "Прочее (скрипты, конфиг)"; prefix = "chore" }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$projectRoot\.git")) {
    Write-Host "Ошибка: это не корень git-репозитория. Запускай из папки fitness-coach-system." -ForegroundColor Red
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
    Write-Host "`n=== Тип изменений ===" -ForegroundColor Cyan
    foreach ($k in ($TYPES.Keys | Sort-Object)) {
        $v = $TYPES[$k]
        Write-Host "  $k. [$($v.prefix)] $($v.label)"
    }
    $choice = Read-Host "`nВыбери (1-5)"
    if (-not $TYPES.ContainsKey($choice)) {
        Write-Host "Отменено." -ForegroundColor Yellow
        exit 0
    }
    $typePrefix = $TYPES[$choice].prefix

    Write-Host "`nКраткое описание (что сделано):" -ForegroundColor Cyan
    $desc = Read-Host
    if (-not $desc) {
        Write-Host "Описание не введено. Отменено." -ForegroundColor Yellow
        exit 0
    }
}

$commitMsg = if ($typePrefix) { "[$typePrefix] $desc" } else { $desc }

Write-Host "`nДобавляю изменения..." -ForegroundColor Cyan
git add .

$status = git status --short
if (-not $status) {
    Write-Host "Нет изменений для коммита." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nИзменённые файлы:" -ForegroundColor Gray
$status | ForEach-Object { Write-Host "  $_" }
Write-Host "`nКоммит: $commitMsg" -ForegroundColor Cyan
$confirm = Read-Host "Создать коммит и отправить? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y" -and $confirm -ne "д" -and $confirm -ne "Д") {
    Write-Host "Отменено." -ForegroundColor Yellow
    exit 0
}

git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "Коммит отменён или не удался." -ForegroundColor Red
    exit 1
}

Write-Host "`nОтправляю на GitHub..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push не удался. Попробуй: git pull, затем снова git push" -ForegroundColor Red
    exit 1
}

Write-Host "`nГотово. Изменения на GitHub." -ForegroundColor Green

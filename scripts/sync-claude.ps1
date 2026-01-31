# Скрипт для автоматической генерации CLAUDE.md
# Запуск: .\scripts\sync-claude.ps1

$ROOT = Split-Path -Parent $PSScriptRoot
$date = Get-Date -Format "yyyy-MM-dd"

# Читаем .cursorrules
$cursorrules = ""
if (Test-Path "$ROOT\.cursorrules") {
    $cursorrules = Get-Content "$ROOT\.cursorrules" -Raw -Encoding UTF8
}

# Генерируем структуру (простой вариант)
function Get-Tree($path, $indent = "") {
    $items = Get-ChildItem $path -ErrorAction SilentlyContinue | Where-Object { 
        $_.Name -notin @('node_modules', '.git', 'archive') -and 
        -not $_.Name.StartsWith('.')
    }
    
    $result = @()
    foreach ($item in $items) {
        $suffix = if ($item.PSIsContainer) { "/" } else { "" }
        $result += "$indent- $($item.Name)$suffix"
        
        if ($item.PSIsContainer -and $indent.Length -lt 8) {
            $result += Get-Tree $item.FullName "$indent  "
        }
    }
    return $result -join "`n"
}

$tree = Get-Tree $ROOT

# Генерируем CLAUDE.md
$output = @"
# FITNESS COACH SYSTEM - Claude Context

> Auto-generated: $date
> Run: .\scripts\sync-claude.ps1

## Project
SaaS for fitness coaches.
- Backend: Google Apps Script (GAS)
- Frontend: Vanilla HTML/CSS/JS
- Database: Google Sheets
- Hosting: Netlify

## Structure
$tree

## .cursorrules
$cursorrules

## API Endpoints
GET  ?action=getClients
GET  ?action=getOfflineDashboard&clientId=X&period=block
GET  ?action=getOnlineDay&clientId=X&weekNumber=N&dayNumber=N
POST action=startSession
POST action=addSet
POST action=finishSession
POST action=saveAssessment

## Code Rules
- Comments: RUSSIAN
- Variables: english camelCase
- Dates: ISO (YYYY-MM-DD)
- Mobile-first design

## Clients
yaroslav - offline - Split
kirill - offline - Fullbody
mark - online - 90 days
alena - hybrid

---
Copy this to Claude.ai chat
"@

# Записываем
$output | Out-File -FilePath "$ROOT\CLAUDE.md" -Encoding UTF8
Write-Host "CLAUDE.md updated" -ForegroundColor Green

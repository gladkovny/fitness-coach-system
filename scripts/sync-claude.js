/**
 * Скрипт для автоматической генерации CLAUDE.md
 * Запуск: node scripts/sync-claude.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Читаем файлы
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  } catch (e) {
    return `[Файл не найден: ${filePath}]`;
  }
}

// Получаем структуру папок
function getTree(dir, prefix = '', depth = 2) {
  if (depth < 0) return '';

  const items = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
  const ignore = ['node_modules', '.git', 'archive', 'Марк'];

  return items
    .filter((item) => !ignore.includes(item.name) && !item.name.startsWith('.'))
    .map((item) => {
      const line = `${prefix}├── ${item.name}${item.isDirectory() ? '/' : ''}`;
      if (item.isDirectory() && depth > 0) {
        return line + '\n' + getTree(path.join(dir, item.name), prefix + '│   ', depth - 1);
      }
      return line;
    })
    .join('\n');
}

// Извлекаем TODO из кода
function extractTodos() {
  const todos = [];
  const files = ['docs/CURRENT_STATE_v5.md', '.cursorrules'];

  files.forEach((file) => {
    const content = readFile(file);
    const matches = content.match(/- \[ \].+/g) || [];
    todos.push(...matches);
  });

  return todos.slice(0, 10).join('\n');
}

// Генерируем CLAUDE.md
const output = `# FITNESS COACH SYSTEM — Claude Context

> Автоматически сгенерировано: ${new Date().toISOString().split('T')[0]}
> Запуск: \`node scripts/sync-claude.js\`

## Проект
Коробочная SaaS-система для фитнес-тренеров.
- **Backend**: Google Apps Script (GAS)
- **Frontend**: Vanilla HTML/CSS/JS
- **Database**: Google Sheets
- **Hosting**: Netlify

## Структура проекта
\`\`\`
${getTree('.', '', 2)}
\`\`\`

## .cursorrules
\`\`\`
${readFile('.cursorrules').slice(0, 1500)}
\`\`\`

## API Endpoints (краткий список)
\`\`\`
GET  ?action=getClients
GET  ?action=getOfflineDashboard&clientId=X&period=block
GET  ?action=getOnlineDay&clientId=X&weekNumber=N&dayNumber=N
POST action=startSession
POST action=addSet
POST action=finishSession
POST action=saveAssessment
\`\`\`

## Правила
- Комментарии: РУССКИЙ
- Переменные: английский camelCase  
- Даты: ISO (YYYY-MM-DD)
- Mobile-first дизайн

## Клиенты
| ID | Тип | Описание |
|----|-----|----------|
| yaroslav | offline | Сплит |
| kirill | offline | Фулбоди |
| mark | online | 90 дней |
| alena | hybrid | — |

## Текущие задачи
${extractTodos() || '- Нет открытых задач'}

---
*Скопируй это в начало диалога с Claude.ai*
`;

// Записываем
fs.writeFileSync(path.join(ROOT, 'CLAUDE.md'), output);
console.log('✅ CLAUDE.md обновлён');
console.log(`📄 ${output.length} символов`);

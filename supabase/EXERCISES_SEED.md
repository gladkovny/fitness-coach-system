# База упражнений в Supabase

## Проблема
Трекер не распознаёт названия тренировок и упражнений, если таблица `exercises` в Supabase пуста.

## Решение

### Вариант 1: Миграция (рекомендуется)
Выполни в Supabase Dashboard → **SQL Editor**:

```sql
-- Скопируй содержимое supabase/migrations/00005_seed_exercises.sql
```

Либо через CLI:
```bash
supabase db push
```

### Вариант 2: Ручной запуск миграции
1. Открой **Supabase Dashboard** → **SQL Editor**
2. Открой файл `supabase/migrations/00005_seed_exercises.sql`
3. Скопируй весь SQL и выполни

### Вариант 3: Миграция из Google Sheets
Если у тебя есть Coach_Master с листом **exercises_master**:
- Запусти в GAS: `migrateToSupabase('exercises')`
- Это перенесёт упражнения из Sheets в Supabase

## Проверка
В Supabase → **Table Editor** → `exercises` — должно быть ~50 записей (или больше после миграции).

## После добавления упражнений
Перезагрузи трекер, выбери клиента — база подгрузится. Ввод вида:
```
Жим лёжа 60×12, 70×10, 80×8
Подтягивания 10, 8, 6 раз
Приседания 100×5
```
должен распознаваться.

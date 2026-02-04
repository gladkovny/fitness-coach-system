-- Отведение гантели назад = задняя дельта, НЕ трицепс
-- В БД может быть "Махи в наклоне", "Задняя дельта (в наклоне)" или "Отведение гантели назад (в наклоне)"
-- Дата: 2026-02-03

UPDATE exercises SET aliases = COALESCE(aliases, '[]'::jsonb) || '["отведение гантели назад"]'::jsonb
WHERE name = 'Махи в наклоне';

UPDATE exercises SET aliases = COALESCE(aliases, '[]'::jsonb) || '["отведение гантели назад"]'::jsonb
WHERE name = 'Задняя дельта (в наклоне)';

UPDATE exercises SET aliases = COALESCE(aliases, '[]'::jsonb) || '["отведение гантели назад"]'::jsonb
WHERE name = 'Отведение гантели назад (в наклоне)';

-- Привязка обязательных задач к блоку (для отображения в профиле по выбранному блоку)
-- Дата: 2026-02-06

ALTER TABLE mandatory_tasks ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES training_blocks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_mandatory_tasks_block ON mandatory_tasks(block_id);
COMMENT ON COLUMN mandatory_tasks.block_id IS 'Если задано — задача для этого блока; NULL — общая для клиента';

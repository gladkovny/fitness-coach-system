/**
 * Распознавание упражнений по названию/алиасам (для тестов).
 * Нормализация: нижний регистр, trim, ё → е.
 */

/**
 * Нормализует строку для сравнения.
 * @param {string} s
 * @returns {string}
 */
function normalizeText(s) {
  if (typeof s !== 'string') return '';
  return s.trim().toLowerCase().replace(/ё/g, 'е');
}

/**
 * Фикстура упражнений: id (key), name, aliases.
 * Соответствует тестовым кейсам и миграциям 00005 / 00011.
 */
function getExerciseList() {
  return [
    { id: 'bench_press', name: 'Жим лёжа', aliases: ['жим лежа', 'жим лёжа', 'бенч'] },
    { id: 'squat', name: 'Приседания', aliases: ['присед', 'приседания со штангой'] },
    {
      id: 'tricep_pushdown',
      name: 'Разгибание рук на блоке',
      aliases: ['разгибания на блоке', 'трицепс на блоке'],
    },
    {
      id: 'skull_crusher',
      name: 'Французский жим',
      aliases: ['французский жим', 'разгибание из-за головы'],
    },
    {
      id: 'pull_up',
      name: 'Подтягивания',
      aliases: ['подтяг', 'подтягивания на перекладине', 'подтягивания'],
    },
    { id: 'deadlift', name: 'Становая тяга', aliases: ['становая', 'становая тяга'] },
    {
      id: 'lat_pulldown',
      name: 'Тяга верхнего блока',
      aliases: ['тяга верхнего блока', 'вертикальная тяга'],
    },
  ];
}

/**
 * По введённой строке возвращает id упражнения или null.
 * Сравнение: нормализованный ввод с name и с каждым alias.
 *
 * @param {string} input — ввод пользователя
 * @param {{ id: string, name: string, aliases: string[] }[]} exercises — список упражнений
 * @returns {string|null} — id упражнения или null
 */
function recognizeExercise(input, exercises) {
  const normalized = normalizeText(input);
  if (!normalized) return null;

  for (const ex of exercises) {
    if (normalizeText(ex.name) === normalized) return ex.id;
    for (const alias of ex.aliases || []) {
      if (normalizeText(alias) === normalized) return ex.id;
    }
  }
  return null;
}

module.exports = {
  normalizeText,
  getExerciseList,
  recognizeExercise,
};

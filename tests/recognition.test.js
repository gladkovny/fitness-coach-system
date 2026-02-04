/**
 * Тесты распознавания упражнений (Node.js assert, без фреймворка).
 * Запуск: npm test
 */

const assert = require('assert');
const { recognizeExercise, getExerciseList } = require('./recognition.js');

const exercises = getExerciseList();

const cases = [
  { input: 'жим лёжа', expectedId: 'bench_press' },
  { input: 'жим лежа', expectedId: 'bench_press' },
  { input: 'приседания', expectedId: 'squat' },
  { input: 'присед', expectedId: 'squat' },
  { input: 'разгибания на блоке', expectedId: 'tricep_pushdown' },
  { input: 'французский жим', expectedId: 'skull_crusher' },
  { input: 'подтягивания', expectedId: 'pull_up' },
  { input: 'становая тяга', expectedId: 'deadlift' },
  { input: 'тяга верхнего блока', expectedId: 'lat_pulldown' },
];

let passed = 0;
let failed = 0;

console.log('Recognition tests\n');

for (const { input, expectedId } of cases) {
  const result = recognizeExercise(input, exercises);
  try {
    assert.strictEqual(
      result,
      expectedId,
      `"${input}" → expected "${expectedId}", got "${result}"`
    );
    console.log(`  ✓ "${input}" → ${expectedId}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ "${input}" → expected ${expectedId}, got ${result}`);
    failed++;
  }
}

console.log(
  '\n' + (failed === 0 ? `All ${passed} tests passed.` : `${passed} passed, ${failed} failed.`)
);
process.exit(failed > 0 ? 1 : 0);

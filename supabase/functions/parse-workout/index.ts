// Supabase Edge Function: парсинг текста тренировки через Gemini
// Аналог GAS parseWorkoutWithAI

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface Exercise {
  name: string;
  category?: string;
  equipment?: string;
  position?: string;
  sets: { weight: number; reps: number }[];
  unilateral?: boolean;
}

interface ParseResult {
  exercises: Exercise[];
  rpe?: number | null;
  duration?: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return json({ success: false, error: 'Текст не передан' }, 400);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return json({ success: false, error: 'GEMINI_API_KEY не настроен' }, 500);
    }

    // Нормализация опечаток: "2 прохода" → "2 подхода"
    const normalizedText = text.replace(/(\d+)\s*проход(?:а|ов)?/gi, '$1 подхода');

    const prompt = `Распарси текст тренировки в JSON.

ЗАПРЕЩЕНО переименовывать:
- "Отведение плеча в тренажере" — это ПЛЕЧИ (махи в сторону). НИКОГДА не заменяй на "Отведение гантели назад" — это трицепс, другое упражнение!
- Вход: "Отведение плеча в тренажере 12,5 кг на 10 раз 3 подхода" → Выход: name="Отведение плеча в тренажере", category="Плечи", sets: 3 подхода по 12.5×10

КАНОНИЧЕСКИЕ НАЗВАНИЯ:
Махи гантелей в стороны, Махи в наклоне, Разгибание рук на блоке, Сгибание рук со штангой и т.д.

ПРАВИЛА КАТЕГОРИЙ:
- "Отведение плеча", "Отведение плеча в тренажере", "Махи в стороны", "Махи в тренажере" → Плечи
- "Отведение гантели назад (в наклоне)" = kickback → Руки (трицепс)

ФОРМАТЫ ПОДХОДОВ:
- "60×12, 70×10" или "40*12, 2 подхода" = 2 одинаковых: 40×12, 40×12
- "12,5 кг на 10 раз 3 подхода" или "27 кг на 15 раз, 2 подхода" = N одинаковых
- "10 кг, 8 и 6 раз" = 2 подхода: 10×8, 10×6

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`):
{"exercises":[{"name":"Название","category":"Грудь|Спина|Ноги|Плечи|Руки|Кор|Другое","equipment":"","position":"","sets":[{"weight":число,"reps":число}],"unilateral":false}],"rpe":null,"duration":null}

Текст:
${normalizedText.trim()}`;

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Gemini API error:', res.status, err);
      return json({ success: false, error: 'Ошибка AI: ' + res.status }, 502);
    }

    const data = await res.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let cleanJson = aiText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (!match) {
      return json({ success: false, error: 'AI не вернул JSON' }, 502);
    }

    const parsed: ParseResult = JSON.parse(match[0]);
    const inputLower = normalizedText.trim().toLowerCase();

    if (parsed.exercises) {
      parsed.exercises = parsed.exercises.map((ex: Exercise) => {
        let name = ex.name || '';
        let category = ex.category || 'Другое';

        // Пост-обработка: AI часто путает "Отведение плеча в тренажере" (плечи) с "Отведение гантели назад" (трицепс)
        if (inputLower.includes('отведение плеча в тренажере') && !inputLower.includes('отведение гантели назад')) {
          const nameLower = name.toLowerCase();
          if ((nameLower.includes('отведение гантели') && nameLower.includes('назад')) || nameLower.includes('гантели назад')) {
            name = 'Отведение плеча в тренажере';
            category = 'Плечи';
          }
        }

        return {
          name,
          category,
          equipment: ex.equipment || '',
          position: ex.position || '',
          sets: ex.sets || [],
          unilateral: ex.unilateral || false
        };
      });

      // Расширение подходов: "27 кг на 15 раз, 2 подхода" или "12,5 кг на 10 раз 3 подхода"
      const lateralMatch = inputLower.match(/отведение плеча[^]*?(\d+(?:[.,]\d+)?)\s*кг\s+на\s+(\d+)\s+раз[^]*?(\d+)\s+подход(?:а|ов)?/i);
      if (lateralMatch) {
        const [, weightStr, repsStr, nStr] = lateralMatch;
        const n = parseInt(nStr, 10);
        const w = parseFloat(weightStr.replace(',', '.'));
        const r = parseInt(repsStr, 10);
        if (n > 1) {
          const idx = parsed.exercises.findIndex((ex: Exercise) => {
            const nl = (ex.name || '').toLowerCase();
            return nl.includes('отведение плеча') && ex.sets?.length === 1;
          });
          if (idx >= 0) {
            parsed.exercises[idx].sets = Array(n).fill(null).map(() => ({ weight: w, reps: r }));
          }
        }
      }
    }

    return json({ success: true, ...parsed });
  } catch (e) {
    console.error('parse-workout error:', e);
    return json({ success: false, error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type'
  };
}

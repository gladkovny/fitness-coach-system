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

    const prompt = `Распарси текст тренировки в JSON.

КАНОНИЧЕСКИЕ НАЗВАНИЯ (предпочтительный формат вывода):
Махи гантелей в стороны, Махи в наклоне, Разгибание рук на блоке, Сгибание рук со штангой, Подтягивания, Жим ногами, Приседания со штангой и т.д. Если пользователь написал разговорный вариант ("махи с гантелями", "бицепс на блоке") — выводи каноническое название.

ПРАВИЛА КАТЕГОРИЙ (category):
- "Отведение плеча", "Махи в стороны", "Отведение руки в сторону" → Плечи (НЕ Руки!)
- "Отведение гантели назад" (kickback на трицепс) → Руки
- "Отведение плеча в тренажере" = махи/разведение на плечи → Плечи

ФОРМАТЫ ПОДХОДОВ:
- "60×12, 70×10" = 2 подхода: 60кг×12, 70кг×10
- "12,5 кг на 10 раз, 3 подхода" = 3 одинаковых подхода: 12.5×10, 12.5×10, 12.5×10
- "10 кг, 8 и 6 раз" = 2 подхода: 10×8, 10×6
- "10 кг, 8, 6 и 5 раз" = 4 подхода: 10×8, 10×6, 10×5
- "по 8 раз с 40 кг, 3 подхода" = 3×40×8

ВАЖНО: Сохраняй название упражнения БЕЗ добавления лишних слов. "Отведение плеча в тренажере" НЕ менять на "Отведение гантели назад (в наклоне)" — это разные упражнения.

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`):
{"exercises":[{"name":"Название","category":"Грудь|Спина|Ноги|Плечи|Руки|Кор|Другое","equipment":"","position":"","sets":[{"weight":число,"reps":число}],"unilateral":false}],"rpe":null,"duration":null}

Текст:
${text.trim()}`;

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
    if (parsed.exercises) {
      parsed.exercises = parsed.exercises.map((ex: Exercise) => ({
        name: ex.name || '',
        category: ex.category || 'Другое',
        equipment: ex.equipment || '',
        position: ex.position || '',
        sets: ex.sets || [],
        unilateral: ex.unilateral || false
      }));
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

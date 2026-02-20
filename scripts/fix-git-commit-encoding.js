/**
 * Fix commit message encoding: Windows-1251 -> UTF-8, or replace mojibake with English.
 * Used as msg-filter for git filter-branch.
 * Run: git filter-branch -f --msg-filter "sh $(pwd)/scripts/run-fix-encoding.sh" -- --all
 */

const iconv = require('iconv-lite');

function readStdin() {
  const chunks = [];
  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function scoreText(str) {
  if (!str || str.length > 5000) return 0;
  const bad = str.replace(/[a-zA-Z0-9\s.,:;!?\-_()[\]/\\'"]/g, '').length;
  return str.length - bad;
}

/** Detect if string looks like mojibake (broken Cyrillic) */
function isMojibake(str) {
  return (
    /РЎ|РћРї|Р С›|РЎвЂљ|Р РµРѕ|Р•РЎР›|Р С—|РЎР‚/.test(str) ||
    (str.includes('Р') && str.includes('С') && str.length > 20)
  );
}

/** Map known broken/Cyrillic messages to English */
function toEnglish(msg) {
  const m = msg.trim();
  if (/ESLint.*Prettier|Prettier.*ESLint/.test(m) && /pre-commit|precommit/.test(m))
    return 'chore: ESLint, Prettier, tests, pre-commit, updated rules';
  if (
    /\.cursorrules|cursorrules/.test(m) &&
    (/протокол|отладка|распознавание|РїСЂРѕС‚РѕРєРѕР»|РѕС‚Р»Р°РґРєР°/.test(m) || m.length < 80)
  )
    return 'chore: update .cursorrules - problem solving, debugging, recognition';
  if (
    /структуры|СЃС‚СЂСѓРєС‚СѓСЂС‹|src\/.*gas\/.*docs\/.*deploy/.test(m) &&
    !/CURRENT_STATE|Реорганизация: CURRENT/.test(m)
  )
    return 'chore: restructure - src/, gas/, docs/, deploy/';
  if (
    /CURRENT_STATE\.md.*Master_API\.gs.*Onboarding\.gs|Р РµРѕСЂРіР°РЅРёР·Р°С†РёСЏ: CURRENT/.test(m)
  )
    return '[chore] Reorganize: CURRENT_STATE.md, Master_API.gs, Onboarding.gs';
  if (/low-resource|Netlify.*Master|деплой Netlify|РґРµРїР»РѕР№ Netlify/.test(m))
    return 'feat: low-resource rule, Netlify deploy, Master/Supabase updates';
  if (
    /fix\(tracker\)|распознавание упражнений|СЂР°СЃРїРѕР·РЅР°РІР°РЅРёРµ/.test(m) &&
    /упражнен|задачи на будущее|Р·Р°РґР°С‡Рё/.test(m)
  )
    return 'fix(tracker): exercise recognition and future tasks';
  if (/обновление функции распознавания|РѕР±РЅРѕРІР»РµРЅРёРµ.*СЂР°СЃРїРѕР·РЅР°РІР°РЅРёРµ/.test(m))
    return 'chore: update exercise recognition function';
  if (
    /Реструктуризация|deploy.*Supabase.*Live Server|Р РµСЃС‚СЂСѓРєС‚СѓСЂРёР·Р°С†РёСЏ/.test(m) &&
    /deploy|Supabase/.test(m)
  )
    return '[chore] Restructure: deploy, Supabase, Live Server, Git workflow';
  if (/Добавил ONDOARDING|добавил CURRENT_STATE/.test(m))
    return 'chore: add ONBOARDING_V2.gs, CURRENT_STATE';
  return null;
}

(async () => {
  const raw = await readStdin();
  if (raw.length === 0) {
    process.stdout.write(raw);
    process.exit(0);
    return;
  }

  const asUtf8 = raw.toString('utf8');
  let decoded1251 = null;
  try {
    decoded1251 = iconv.decode(raw, 'win1251');
  } catch (_) {
    /* ignore */
  }

  // 1) Try decode raw as Windows-1251 -> get Russian -> map to English
  if (decoded1251 && scoreText(decoded1251) >= decoded1251.length * 0.5) {
    const en = toEnglish(decoded1251);
    if (en) {
      process.stdout.write(en);
      process.exit(0);
      return;
    }
    process.stdout.write(iconv.encode(decoded1251, 'utf8'));
    process.exit(0);
    return;
  }

  // 2) Current string is mojibake or mixed -> try map to English
  if (isMojibake(asUtf8) || (decoded1251 && scoreText(decoded1251) < decoded1251.length * 0.5)) {
    const en = toEnglish(asUtf8);
    if (en) {
      process.stdout.write(en);
      process.exit(0);
      return;
    }
    if (isMojibake(asUtf8)) {
      process.stdout.write('chore: fix encoding (message was Cyrillic)');
      process.exit(0);
      return;
    }
  }

  process.stdout.write(raw);
})();

/**
 * Автоматическая настройка Auth: создание пользователя и связывание с тренером
 * Запуск: node setup_auth.js (из папки supabase/scripts)
 * Требует: .env с SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть в .env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ═══════════════════════════════════════════════════════════════
// КОНФИГ: замени на свои значения
// ═══════════════════════════════════════════════════════════════

const TRAINER_EMAIL = 'gladkovny@gmail.com'; // Email тренера
const TRAINER_PASSWORD = 'WorldClass1'; // Пароль для нового пользователя (если создаётся)
const TRAINER_NAME = 'Николай'; // Имя тренера (для обновления, если нужно)

async function main() {
  console.log('🔐 Настройка Supabase Auth...\n');

  // 1. Проверяем, есть ли пользователь
  const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(TRAINER_EMAIL);
  
  let userId;
  if (existingUser?.user) {
    userId = existingUser.user.id;
    console.log(`✅ Пользователь уже существует: ${TRAINER_EMAIL} (id: ${userId})`);
  } else {
    // 2. Создаём пользователя
    console.log(`📝 Создание пользователя: ${TRAINER_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TRAINER_EMAIL,
      password: TRAINER_PASSWORD,
      email_confirm: true, // Автоподтверждение email
    });
    
    if (createError) {
      throw new Error(`Ошибка создания пользователя: ${createError.message}`);
    }
    
    userId = newUser.user.id;
    console.log(`✅ Пользователь создан: ${userId}`);
  }

  // 3. Находим тренера в БД
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id, email, name')
    .eq('email', TRAINER_EMAIL)
    .single();

  if (trainerError || !trainer) {
    throw new Error(`Тренер с email ${TRAINER_EMAIL} не найден в таблице trainers. Сначала создай тренера или обнови email.`);
  }

  // 4. Связываем тренера с пользователем
  console.log(`🔗 Связывание тренера ${trainer.name || trainer.email} (id: ${trainer.id}) с пользователем ${userId}...`);
  
  const { error: updateError } = await supabase
    .from('trainers')
    .update({ auth_id: userId })
    .eq('id', trainer.id);

  if (updateError) {
    throw new Error(`Ошибка обновления trainers: ${updateError.message}`);
  }

  console.log(`✅ Тренер связан с пользователем!\n`);

  // 5. Проверка
  const { data: check, error: checkError } = await supabase
    .from('trainers')
    .select('id, email, name, auth_id')
    .eq('id', trainer.id)
    .single();

  if (checkError) {
    throw new Error(`Ошибка проверки: ${checkError.message}`);
  }

  console.log('📊 Результат:');
  console.log(`   Тренер: ${check.name || check.email} (id: ${check.id})`);
  console.log(`   Auth ID: ${check.auth_id}`);
  console.log(`   Email: ${check.email}\n`);

  if (check.auth_id === userId) {
    console.log('✅ Настройка Auth завершена успешно!');
    console.log(`\n🔑 Теперь можно войти в систему с:`);
    console.log(`   Email: ${TRAINER_EMAIL}`);
    console.log(`   Password: ${TRAINER_PASSWORD}\n`);
  } else {
    console.log('⚠️  Предупреждение: auth_id не совпадает. Проверь вручную.');
  }
}

main().catch((e) => {
  console.error('❌ Ошибка:', e.message);
  process.exit(1);
});

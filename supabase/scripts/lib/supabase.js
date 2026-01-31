/**
 * Supabase client с service_role для миграции (обходит RLS).
 */
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть заданы в .env');
  client = createClient(url, key);
  return client;
}

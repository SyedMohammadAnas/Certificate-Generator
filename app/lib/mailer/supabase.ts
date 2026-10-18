import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from '@/app/lib/mailer/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MailerClient = SupabaseClient<any, 'mass_mailer', any>;

let cached: MailerClient | null = null;

export function mailerDb(): MailerClient {
  if (cached) return cached;
  cached = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    db: { schema: 'mass_mailer' },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Service-role client. Bypasses RLS entirely — only for trusted server-side
// code (route handlers, server actions) that needs cross-row admin
// aggregates or must act before a user session exists (e.g. guest booking
// writes, notification sends, invoice generation). The `server-only` import
// makes accidentally bundling this into client code a build-time error.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
